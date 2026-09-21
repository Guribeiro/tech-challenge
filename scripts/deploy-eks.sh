#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-deploy}"
AWS_REGION="${AWS_REGION:-us-east-1}"
EKS_CLUSTER="${EKS_CLUSTER:-oficina-eks}"
ECR_REPOSITORY="${ECR_REPOSITORY:-oficina-app}"
NAMESPACE="oficina-mecanica"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short HEAD)}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-oficina_db}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
JWT_SECRET="${JWT_SECRET:-sua-chave-secreta-learning-lab}"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Erro: '$1' não está instalado ou não está no PATH." >&2
    exit 1
  }
}

require_command aws
require_command eksctl

if [[ "$ACTION" != "down" ]]; then
  require_command kubectl
  require_command docker
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Erro: o AWS CLI não encontrou credenciais válidas.
Configure a sessão do AWS Learning Lab antes de executar este script:
  aws login
ou exporte AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_SESSION_TOKEN
fornecidos pelo laboratório e confirme com: aws sts get-caller-identity
EOF
  exit 1
fi

if [[ "$ACTION" != "down" ]]; then
  ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
  ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
  IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
fi

find_role_arn() {
  local role_fragment="$1"
  local role_arn
  role_arn="$(aws iam list-roles \
    --query "Roles[?contains(RoleName, '${role_fragment}')].Arn" \
    --output text | awk '{print $1}')"
  if [[ -z "$role_arn" || "$role_arn" == "None" ]]; then
    echo "Erro: nenhuma role IAM contendo '${role_fragment}' foi encontrada." >&2
    exit 1
  fi
  printf '%s' "$role_arn"
}

ensure_ecr_repository() {
  if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" >/dev/null 2>&1; then
    aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION" >/dev/null
  fi
}

build_and_push() {
  ensure_ecr_repository
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
  docker build --target production -t "$IMAGE_URI" -t "${ECR_REGISTRY}/${ECR_REPOSITORY}:latest" "$ROOT_DIR"
  docker push "$IMAGE_URI"
  docker push "${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"
}

create_cluster() {
  local config_file cluster_role_arn node_role_arn
  config_file="$(mktemp)"
  cluster_role_arn="$(find_role_arn 'LabEksClusterRole')"
  node_role_arn="$(find_role_arn 'LabEksNodeRole')"
  sed -e "s/name: oficina-eks/name: ${EKS_CLUSTER}/" \
    -e "s/region: us-east-1/region: ${AWS_REGION}/" \
    -e "s|__EKS_CLUSTER_ROLE_ARN__|${cluster_role_arn}|g" \
    -e "s|__EKS_NODE_ROLE_ARN__|${node_role_arn}|g" \
    "$ROOT_DIR/eksctl.yaml" > "$config_file"
  eksctl create cluster -f "$config_file"
  rm -f "$config_file"
  aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER"
}

apply_secrets() {
  local database_url
  database_url="postgresql://${DB_USER}:${DB_PASSWORD}@postgres-service:5432/${DB_NAME}?schema=public"
  kubectl create secret generic oficina-db-secret -n "$NAMESPACE" \
    --from-literal=POSTGRES_USER="$DB_USER" \
    --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
    --from-literal=POSTGRES_DB="$DB_NAME" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl create secret generic oficina-app-secret -n "$NAMESPACE" \
    --from-literal=DATABASE_URL="$database_url" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -
}

deploy_workloads() {
  local rendered_app rendered_job
  rendered_app="$(mktemp)"
  rendered_job="$(mktemp)"
  sed "s|__IMAGE_URI__|${IMAGE_URI}|g" "$ROOT_DIR/k8s/eks/app.yaml" > "$rendered_app"
  sed "s|__IMAGE_URI__|${IMAGE_URI}|g" "$ROOT_DIR/k8s/eks/migration-job.yaml" > "$rendered_job"

  kubectl apply -f "$ROOT_DIR/k8s/eks/namespace.yaml"
  apply_secrets
  kubectl delete statefulset postgres -n "$NAMESPACE" --ignore-not-found
  kubectl delete pvc postgres-data-postgres-0 -n "$NAMESPACE" --ignore-not-found
  kubectl apply -f "$ROOT_DIR/k8s/eks/postgres.yaml"
  kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=180s
  kubectl delete job oficina-prisma-migrate -n "$NAMESPACE" --ignore-not-found
  kubectl apply -f "$rendered_job"
  kubectl wait --for=condition=complete job/oficina-prisma-migrate -n "$NAMESPACE" --timeout=180s
  kubectl apply -f "$rendered_app"
  kubectl rollout status deployment/oficina-app-deployment -n "$NAMESPACE" --timeout=180s
  rm -f "$rendered_app" "$rendered_job"
}

case "$ACTION" in
  up)
    create_cluster
    build_and_push
    deploy_workloads
    ;;
  deploy)
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER"
    build_and_push
    deploy_workloads
    ;;
  down)
    eksctl delete cluster --name "$EKS_CLUSTER" --region "$AWS_REGION"
    ;;
  *)
    echo "Uso: $0 {up|deploy|down}" >&2
    exit 2
    ;;
esac

if [[ "$ACTION" != "down" ]]; then
  echo "API: $(kubectl get service oficina-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
fi