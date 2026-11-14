# RFC 0001 — Provedor de nuvem: AWS (Learner Lab)

- **Status:** aceita
- **Data:** 2026-11-13

## Contexto

A fase 3 exige API Gateway, função serverless para autenticação, banco gerenciado, cluster
Kubernetes gerenciado e infraestrutura como código, com ambientes de homologação e produção.
O time não tem orçamento próprio de nuvem; a FIAP fornece contas do **AWS Academy Learner
Lab**, com crédito limitado, credenciais temporárias (sessões de cerca de 4 horas) e IAM
restrito (não é possível criar roles; há roles pré-provisionadas como `LabRole`,
`LabEksClusterRole` e `LabEksNodeRole`).

## Opções avaliadas

| Critério | AWS (Learner Lab) | Azure for Students | GCP (free trial) |
| --- | --- | --- | --- |
| Custo para o time | Crédito da FIAP | Crédito de estudante | Crédito de avaliação, exige cartão |
| API Gateway + função serverless | API Gateway HTTP API + Lambda (authorizer nativo) | API Management + Functions | API Gateway + Cloud Functions |
| Kubernetes gerenciado | EKS | AKS | GKE |
| PostgreSQL gerenciado | RDS | Azure Database for PostgreSQL | Cloud SQL |
| Continuidade | Fase 2 já rodou no EKS do Learner Lab | Recomeço | Recomeço |
| Restrições | Sem criação de IAM, credenciais temporárias | Cotas de estudante | Exige dados de pagamento |

## Decisão

Usar a **AWS pelo Learner Lab**, região `us-east-1`, com:

- API Gateway HTTP API (mais barato e simples que o REST API, com Lambda Authorizer);
- Lambda Node.js 22 para autenticação;
- EKS para a API e RDS PostgreSQL para os dados;
- Terraform para todos os recursos, reaproveitando as roles do laboratório via data sources
  (inclusive quando o lab as cria com prefixo/sufixo aleatório).

## Consequências

- **Positivas:** sem custo para o time; serviços gerenciados que atendem a todos os requisitos;
  continuidade com o EKS da fase 2; documentação e provedores Terraform maduros.
- **Negativas e mitigação:**
  - Credenciais expiram a cada sessão: `bootstrap/github-secrets.sh` (infra-k8s) atualiza os
    secrets dos GitHub Environments.
  - Crédito limitado e recursos que continuam cobrando com o lab encerrado (EKS, NAT, NLB,
    RDS): `scripts/teardown.sh` e `scripts/bringup.sh` destroem e recriam tudo entre sessões;
    um único cluster e um único NAT atendem os dois ambientes ([ADR 0003](../adrs/0003-um-cluster-namespaces-por-ambiente.md)).
  - Sem criação de roles IAM: Enhanced Monitoring/Performance Insights do RDS e IRSA não são
    usados; as Lambdas usam `LabRole`.
