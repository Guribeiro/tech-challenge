# Guia de infraestrutura e operação

Como a API é executada localmente e na AWS, como o deploy funciona e como operar os ambientes
no AWS Learner Lab. A visão arquitetural está em [arquitetura.md](./arquitetura.md).

## Onde está cada parte

| Parte | Onde |
| --- | --- |
| Rede, EKS, ECR, add-ons, VPC Link, HTTP APIs, authorizer, dashboards e alertas | [oficina-infra-k8s](https://github.com/Guribeiro/oficina-infra-k8s) |
| RDS PostgreSQL e segredos (Secrets Manager) | [oficina-infra-db](https://github.com/Guribeiro/oficina-infra-db) |
| Lambdas de autenticação por CPF e authorizer | [oficina-lambda-auth](https://github.com/Guribeiro/oficina-lambda-auth) |
| API, manifests Kubernetes e deploy da aplicação | este repositório: [`k8s/`](../k8s), [`scripts/deploy.sh`](../scripts/deploy.sh) |
| Ambiente local com Kind (desenvolvimento) | este repositório: [`src/infra/terraform`](../src/infra/terraform), `Makefile` |

## Ambiente local

### Docker Compose (desenvolvimento do dia a dia)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

API em `http://localhost:3000/api` e Swagger em `http://localhost:3000/docs`. O agente New
Relic fica desligado sem `NEW_RELIC_LICENSE_KEY`.

### Kubernetes local com Kind (opcional)

Valida os manifests e o HPA num cluster local, sem AWS. O Terraform em `src/infra/terraform`
cria o cluster Kind `oficina-cluster`, o PostgreSQL e a API no namespace `oficina-mecanica`:

```bash
make up        # build da imagem, Terraform (Kind), rollout e seed - http://localhost:30000
make status    # pods
make logs      # logs da API
make down      # destrói o cluster
```

## Ambientes na AWS

| | hml | prd |
| --- | --- | --- |
| Branch | `develop` | `main` |
| Namespace | `oficina-hml` | `oficina-prd` |
| HPA | 1 a 2 réplicas | 2 a 4 réplicas |
| Banco | `oficina-db-hml` | `oficina-db-prd` |

Manifests: [`k8s/base`](../k8s/base) (ConfigMap, Deployment com probes, Service com NLB
interno, HPA, Jobs de migration e seed) e os overlays [`k8s/overlays/hml`](../k8s/overlays/hml)
e [`k8s/overlays/prd`](../k8s/overlays/prd) (namespace, réplicas, limites do HPA, nome da
aplicação no New Relic e tags do NLB que o API Gateway usa para encontrá-lo).

### Deploy da aplicação

O [`scripts/deploy.sh`](../scripts/deploy.sh) é usado pela pipeline e localmente:

1. Lê `oficina/<env>/db` e `oficina/<env>/jwt` do Secrets Manager e cria o Secret
   `oficina-app-secret` (com `NEW_RELIC_LICENSE_KEY`, quando houver).
2. Executa as migrations do Prisma em um Job contra o RDS.
3. Aplica o overlay do ambiente com a imagem do ECR (tag = SHA do commit).
4. Grava o checksum do Secret no template dos pods, forçando o rollout se um segredo mudou
   ([ADR 0006](./adrs/0006-rollout-por-checksum-do-secret.md)), e aguarda o rollout.
5. Opcionalmente executa o seed demonstrativo (`SEED=true`, destrutivo).
6. Faz um smoke test interno em `/api/health`.

```bash
# Requisitos: aws, kubectl, jq; imagem já publicada no ECR com a tag do commit
export AWS_PROFILE=learnerlab
NEW_RELIC_LICENSE_KEY=<license> make deploy ENV=hml
make deploy-dry-run ENV=prd    # renderiza os manifests sem acessar a AWS
```

### Pipeline (GitHub Actions)

| Workflow | Gatilho | O que faz |
| --- | --- | --- |
| [`quality.yml`](../.github/workflows/quality.yml) | push e PR em `develop`/`main` | lint, testes unitários e e2e (PostgreSQL de serviço) |
| [`docker-build.yml`](../.github/workflows/docker-build.yml) | sucesso do Quality em push | build da imagem `production` e push no ECR com as tags `<sha>` e `<env>-latest` |
| [`deploy.yml`](../.github/workflows/deploy.yml) | sucesso do build, ou manual | `scripts/deploy.sh` no ambiente da branch, marcador de deployment no New Relic e resumo (imagem, namespace, seed) |

O deploy manual (`workflow_dispatch`) permite escolher o ambiente, uma tag de imagem e rodar o
seed. A `main` é protegida: exige pull request com os checks Code Linting, Unit Tests e E2E
Tests.

### Configuração do GitHub

GitHub Environments `homologacao` e `producao`:

| Tipo | Nome | Origem |
| --- | --- | --- |
| Secret | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | sessão do Learner Lab, via `bootstrap/github-secrets.sh` do infra-k8s |
| Secret | `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_API_KEY` | `bootstrap/github-newrelic.sh` do infra-k8s |
| Variable | `NEW_RELIC_ENTITY_GUID` | GUID da aplicação APM do ambiente (`oficina-app-hml` / `oficina-app-prd`) |
| Variable (repositório, opcional) | `AWS_REGION`, `EKS_CLUSTER`, `ECR_REPOSITORY` | padrões `us-east-1`, `oficina-eks`, `oficina-app` |

## Operação no Learner Lab

As credenciais do laboratório expiram a cada sessão (cerca de 4 horas), e encerrar a sessão só
para as instâncias EC2: EKS, NAT Gateway, NLBs e RDS continuam consumindo o crédito. O
infra-k8s tem scripts para o ciclo completo, orquestrando os 4 repositórios clonados lado a
lado:

```bash
cd ../oficina-infra-k8s

# Início de sessão: credenciais do lab no perfil learnerlab (~/.aws/credentials) e então
./scripts/bringup.sh            # plataforma, bancos, app, gateway, Lambdas e smoke test (~40 min)
./bootstrap/github-secrets.sh   # credenciais novas nos GitHub Environments

# Fim de sessão: destrói tudo na ordem correta (pede confirmação)
./scripts/teardown.sh
```

Os bancos são recriados vazios e populados pelo seed; as URLs do API Gateway mudam a cada
recriação (o `bringup.sh` imprime as novas).

## Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| `401` em rota protegida | Falta o cabeçalho `Authorization: Bearer <token>` (o gateway recusa antes do authorizer). |
| `403` com `{"message":"Forbidden"}` | Token recusado pelo authorizer: expirado, de outro ambiente ou assinado com outro segredo. |
| `403` com mensagem de perfil | Token válido, mas o perfil não tem acesso à rota (`RolesGuard` da API). |
| `503`/`504` no gateway | NLB sem alvos saudáveis: `kubectl get pods -n oficina-<env>` e `kubectl describe deploy/oficina-app-deployment`. |
| Pods sem um valor novo do Secret | Fazer novo deploy: o checksum força o rollout. |
| Correlacionar uma requisição | Pegue o `x-request-id` da resposta e procure no access log do gateway (`/aws/apigateway/oficina-api-<env>`), nos logs da Lambda e no New Relic (`FROM Log WHERE request_id = '...'`). |
