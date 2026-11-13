#!/usr/bin/env bash
# Deploy da API no EKS por ambiente (hml | prd).
#
# Usado pelo workflow .github/workflows/deploy.yml e localmente via `make deploy ENV=hml`.
# A infraestrutura (VPC, EKS, ECR, RDS e segredos) é provisionada pelos repositórios
# oficina-infra-k8s e oficina-infra-db; este script apenas publica a aplicação:
#
#   1. Lê as credenciais do banco e o JWT_SECRET do AWS Secrets Manager.
#   2. Cria/atualiza o Secret Kubernetes da aplicação.
#   3. Executa as migrations do Prisma (Job) contra o RDS.
#   4. Aplica os manifests Kustomize do ambiente e aguarda o rollout.
#   5. (Opcional) executa o seed demonstrativo.
#   6. Faz um smoke test interno no /api/health.
#
# Variáveis:
#   IMAGE_TAG              tag da imagem no ECR (padrão: SHA curto do HEAD)
#   AWS_REGION             padrão us-east-1
#   EKS_CLUSTER            padrão oficina-eks
#   ECR_REPOSITORY         padrão oficina-app
#   DB_SECRET_ID           padrão oficina/<env>/db  (JSON: host, port, username, password, dbname)
#   JWT_SECRET_ID          padrão oficina/<env>/jwt (JSON: secret)
#   NEW_RELIC_LICENSE_KEY  opcional; sem ela o agente APM fica desativado
#   SEED=true              executa o seed demonstrativo (destrutivo)
#   DRY_RUN=1              não acessa AWS/cluster: usa DB_SECRET_JSON/JWT_SECRET_JSON (ou valores
#                          fictícios) e imprime os manifests renderizados com segredos mascarados
set -euo pipefail

ENVIRONMENT="${1:-}"
if [[ "$ENVIRONMENT" != "hml" && "$ENVIRONMENT" != "prd" ]]; then
  echo "Uso: $0 <hml|prd>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY_DIR="$ROOT_DIR/k8s/overlays/$ENVIRONMENT"
NAMESPACE="oficina-$ENVIRONMENT"

AWS_REGION="${AWS_REGION:-us-east-1}"
EKS_CLUSTER="${EKS_CLUSTER:-oficina-eks}"
ECR_REPOSITORY="${ECR_REPOSITORY:-oficina-app}"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short HEAD)}"
DB_SECRET_ID="${DB_SECRET_ID:-oficina/$ENVIRONMENT/db}"
JWT_SECRET_ID="${JWT_SECRET_ID:-oficina/$ENVIRONMENT/jwt}"
NEW_RELIC_LICENSE_KEY="${NEW_RELIC_LICENSE_KEY:-}"
SEED="${SEED:-false}"
DRY_RUN="${DRY_RUN:-0}"
TIMEOUT="${TIMEOUT:-300s}"

log() { printf '\n==> %s\n' "$*"; }

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Erro: '$1' não está instalado ou não está no PATH." >&2
    exit 1
  }
}

is_dry_run() { [[ "$DRY_RUN" == "1" ]]; }

require_command kubectl
require_command jq
is_dry_run || require_command aws

# ---------------------------------------------------------------------------
# Segredos (AWS Secrets Manager)
# ---------------------------------------------------------------------------
read_secret() {
  local secret_id="$1" fallback_json="$2"
  if is_dry_run; then
    printf '%s' "$fallback_json"
    return
  fi
  aws secretsmanager get-secret-value \
    --region "$AWS_REGION" \
    --secret-id "$secret_id" \
    --query SecretString \
    --output text
}

build_database_url() {
  local db_json="$1"
  # Usuário e senha são codificados (@uri) para suportar caracteres especiais.
  # sslmode=require + uselibpqcompat: o RDS PostgreSQL 16 exige TLS (rds.force_ssl=1);
  # a conexão é criptografada sem depender do bundle de CA da AWS na imagem.
  jq -er '
    "postgresql://\(.username | @uri):\(.password | @uri)@\(.host):\(.port // 5432)/\(.dbname)"
    + "?schema=public&sslmode=require&uselibpqcompat=true"
  ' <<<"$db_json"
}

resolve_image_uri() {
  if is_dry_run; then
    printf '000000000000.dkr.ecr.%s.amazonaws.com/%s:%s' "$AWS_REGION" "$ECR_REPOSITORY" "$IMAGE_TAG"
    return
  fi
  local account_id
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  printf '%s.dkr.ecr.%s.amazonaws.com/%s:%s' "$account_id" "$AWS_REGION" "$ECR_REPOSITORY" "$IMAGE_TAG"
}

# Renderiza um diretório Kustomize trocando a imagem placeholder pela imagem do ECR.
render() {
  kubectl kustomize "$1" | sed "s|image: oficina-app:latest|image: ${IMAGE_URI}|g"
}

app_secret_manifest() {
  kubectl create secret generic oficina-app-secret \
    --namespace "$NAMESPACE" \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=NEW_RELIC_LICENSE_KEY="$NEW_RELIC_LICENSE_KEY" \
    --dry-run=client -o yaml
}

# ---------------------------------------------------------------------------
# Kubernetes
# ---------------------------------------------------------------------------
diagnose() {
  echo "::group::Diagnóstico do deploy ($NAMESPACE)" || true
  kubectl get pods,jobs,svc,hpa --namespace "$NAMESPACE" -o wide || true
  kubectl logs job/oficina-prisma-migrate --namespace "$NAMESPACE" --all-containers --tail=200 || true
  kubectl describe deployment/oficina-app-deployment --namespace "$NAMESPACE" || true
  kubectl logs -l app=oficina-app --namespace "$NAMESPACE" --all-containers --tail=200 || true
  kubectl get events --namespace "$NAMESPACE" --sort-by=.lastTimestamp || true
  echo "::endgroup::" || true
}

run_job() {
  local job_name="$1"
  # Jobs são imutáveis: remove a execução anterior antes de aplicar a nova imagem.
  kubectl delete job "$job_name" --namespace "$NAMESPACE" --ignore-not-found --wait=true
  render "$OVERLAY_DIR/jobs" | select_job "$job_name" | kubectl apply -f -
  kubectl wait --for=condition=complete "job/$job_name" --namespace "$NAMESPACE" --timeout="$TIMEOUT"
  kubectl logs "job/$job_name" --namespace "$NAMESPACE" --tail=50 || true
}

# Extrai um único Job (documento YAML) da saída renderizada.
select_job() {
  awk -v name="$1" '
    BEGIN { RS = "\n---\n"; ORS = "\n---\n" }
    $0 ~ "kind: Job" && $0 ~ "name: " name "\n" { print }
  '
}

smoke_test() {
  kubectl run "smoke-$(date +%s)" \
    --namespace "$NAMESPACE" \
    --rm -i --restart=Never --quiet \
    --image=curlimages/curl:8.11.1 \
    -- curl -fsS --retry 10 --retry-delay 3 --retry-all-errors \
    "http://oficina-service/api/health"
  echo
}

# ---------------------------------------------------------------------------
# Execução
# ---------------------------------------------------------------------------
log "Ambiente: $ENVIRONMENT | namespace: $NAMESPACE | tag: $IMAGE_TAG$(is_dry_run && echo ' | DRY_RUN')"

IMAGE_URI="$(resolve_image_uri)"
DB_JSON="$(read_secret "$DB_SECRET_ID" "${DB_SECRET_JSON:-{\"host\":\"oficina-db.example.rds.amazonaws.com\",\"port\":5432,\"username\":\"oficina\",\"password\":\"s3nh@:fict/cia\",\"dbname\":\"oficina_$ENVIRONMENT\"}}")"
JWT_JSON="$(read_secret "$JWT_SECRET_ID" "${JWT_SECRET_JSON:-{\"secret\":\"segredo-ficticio\"}}")"
DATABASE_URL="$(build_database_url "$DB_JSON")"
JWT_SECRET="$(jq -er '.secret' <<<"$JWT_JSON")"

if is_dry_run; then
  log "Imagem: $IMAGE_URI"
  log "Secret oficina-app-secret (valores mascarados)"
  app_secret_manifest | sed -E 's/^(  [A-Z_]+: ).+$/\1<redacted>/'
  log "DATABASE_URL (senha mascarada)"
  sed -E 's#(://[^:]+:)[^@]+@#\1<redacted>@#' <<<"$DATABASE_URL"
  log "Manifests da aplicação"
  render "$OVERLAY_DIR"
  log "Job de migration"
  render "$OVERLAY_DIR/jobs" | select_job oficina-prisma-migrate
  exit 0
fi

trap diagnose ERR

log "Configurando acesso ao cluster $EKS_CLUSTER"
aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER" >/dev/null

log "Aplicando namespace e Secret da aplicação"
kubectl apply -f "$OVERLAY_DIR/namespace.yaml"
app_secret_manifest | kubectl apply -f -

log "Executando migrations do Prisma"
run_job oficina-prisma-migrate

log "Publicando a aplicação ($IMAGE_URI)"
render "$OVERLAY_DIR" | kubectl apply -f -
kubectl rollout status deployment/oficina-app-deployment --namespace "$NAMESPACE" --timeout="$TIMEOUT"

if [[ "$SEED" == "true" ]]; then
  log "Executando seed demonstrativo"
  run_job oficina-prisma-seed
fi

log "Smoke test interno em /api/health"
smoke_test

log "Deploy concluído"
kubectl get svc,hpa,pods --namespace "$NAMESPACE"
