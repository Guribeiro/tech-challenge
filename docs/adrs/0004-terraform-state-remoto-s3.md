# ADR 0004 — Terraform com state remoto no S3 e lock nativo

- **Status:** aceito
- **Data:** 2026-11-13

## Contexto

A infraestrutura está dividida em três repositórios Terraform (`oficina-infra-k8s`,
`oficina-infra-db`, `oficina-lambda-auth`), aplicados pelo GitHub Actions e, quando preciso,
localmente. Eles dependem dos outputs uns dos outros (VPC, subnets, IDs da HTTP API,
security groups), e duas execuções simultâneas não podem corromper o state.

## Decisão

- Um **bucket S3 versionado e criptografado** (`oficina-tfstate-<account_id>`, criado por
  `bootstrap/state.sh` do infra-k8s) guarda todos os states, com uma chave por
  repositório, stack e ambiente (ex.: `oficina-infra-db/hml/terraform.tfstate`).
- **Lock nativo do S3** (`use_lockfile = true`, Terraform ≥ 1.10), sem tabela DynamoDB.
- Dependências entre repositórios por **`terraform_remote_state`** (somente leitura dos
  outputs).
- Nos workflows, `concurrency` por stack e ambiente evita applies paralelos do mesmo state.

## Consequências

- Applies do CI e locais compartilham o mesmo state com segurança; o versionamento do bucket
  permite recuperar um state anterior.
- Os outputs consumidos por outros repositórios viram contrato e são documentados nos README.
- Ordem de provisionamento explícita (plataforma → banco → app → environment → Lambdas →
  environment), automatizada em `scripts/bringup.sh` e invertida em `scripts/teardown.sh`.
- O bucket fica fora do Terraform (bootstrap) e não é destruído no teardown.
