# Entrega — Tech Challenge Fase 3

Conteúdo do PDF de entrega no Portal do Aluno. Os links apontam para a branch `main`.

## 1. Repositórios

| # | Repositório | Conteúdo |
| --- | --- | --- |
| 1 | https://github.com/Guribeiro/oficina-lambda-auth | Function serverless: autenticação por CPF e Lambda Authorizer (Node.js + TypeScript, Terraform) |
| 2 | https://github.com/Guribeiro/oficina-infra-k8s | Infraestrutura Kubernetes: VPC, EKS, ECR, API Gateway, New Relic (Terraform) |
| 3 | https://github.com/Guribeiro/oficina-infra-db | Banco de dados gerenciado: RDS PostgreSQL e Secrets Manager (Terraform) |
| 4 | https://github.com/Guribeiro/tech-challenge | Aplicação principal (NestJS) executando no EKS |

Os quatro repositórios têm a `main` protegida (sem commits diretos, pull request obrigatório
com checks de CI) e deploy automático: `develop` → homologação, `main` → produção.

## 2. Vídeo de demonstração

- Link: `<preencher com o link do YouTube/Vimeo>`
- Duração: até 15 minutos. Roteiro em [roteiro-video.md](./roteiro-video.md).

## 3. Documentação

| Documento | Link |
| --- | --- |
| Arquitetura (componentes, sequências, CI/CD, observabilidade) | https://github.com/Guribeiro/tech-challenge/blob/main/docs/arquitetura.md |
| Modelo de dados (justificativa do banco, diagrama ER, relacionamentos) | https://github.com/Guribeiro/tech-challenge/blob/main/docs/modelo-dados.md |
| RFCs | https://github.com/Guribeiro/tech-challenge/tree/main/docs/rfcs |
| ADRs | https://github.com/Guribeiro/tech-challenge/tree/main/docs/adrs |
| Infraestrutura e operação | https://github.com/Guribeiro/tech-challenge/blob/main/docs/INFRASTRUCTURE.md |
| Coleção Postman | https://github.com/Guribeiro/tech-challenge/blob/main/docs/postman/oficina-fase3.postman_collection.json |
| Ciclo de sessão no Learner Lab | https://github.com/Guribeiro/oficina-infra-k8s/blob/main/docs/learner-lab.md |

## 4. Deploys

| Ambiente | URL base (API Gateway) | Swagger |
| --- | --- | --- |
| Homologação | https://0bagr12oql.execute-api.us-east-1.amazonaws.com | https://0bagr12oql.execute-api.us-east-1.amazonaws.com/docs |
| Produção | https://cvqm7rpmdg.execute-api.us-east-1.amazonaws.com | https://cvqm7rpmdg.execute-api.us-east-1.amazonaws.com/docs |

> O ambiente roda no AWS Academy Learner Lab, que tem crédito limitado e credenciais de
> sessão. Para não consumir o crédito, a infraestrutura é destruída ao fim de cada sessão e
> recriada com `scripts/bringup.sh` (infra-k8s), o que gera novas URLs. As URLs acima são da
> sessão de gravação do vídeo; o vídeo mostra o ambiente em execução.

Os dashboards e alertas do New Relic (Operacional e Negócio, por ambiente) são provisionados
por Terraform e exigem acesso à conta; eles são apresentados no vídeo.

## 5. Usuário `soat-architecture`

O usuário `soat-architecture` foi adicionado como colaborador e **aceitou o convite** nos
quatro repositórios (`oficina-lambda-auth`, `oficina-infra-k8s`, `oficina-infra-db`,
`tech-challenge`).

## 6. Requisitos x evidências

| Requisito | Onde está |
| --- | --- |
| API Gateway | HTTP API por ambiente — `oficina-infra-k8s/stacks/environment` |
| Rotas protegidas por autenticação via CPF | Lambda Authorizer em `ANY /api/{proxy+}`; perfis por rota na API |
| Function serverless: valida CPF, consulta existência e status, gera JWT | `oficina-lambda-auth/src/handlers/auth-cpf.ts` — [RFC 0003](./rfcs/0003-autenticacao-lambda-jwt.md) |
| 4 repositórios com CI/CD e deploy automático hml/prd | Workflows em `.github/workflows` de cada repositório |
| Branch `main` protegida e PR obrigatório | Branch protection nos 4 repositórios |
| Banco gerenciado | RDS PostgreSQL 16 por ambiente — `oficina-infra-db` — [RFC 0002](./rfcs/0002-banco-postgresql-rds.md) |
| Kubernetes com escalabilidade | EKS + HPA — [ADR 0002](./adrs/0002-escalabilidade-com-hpa.md) |
| Terraform | Toda a infraestrutura, com state remoto — [ADR 0004](./adrs/0004-terraform-state-remoto-s3.md) |
| Observabilidade (New Relic): latência, CPU/memória, health/uptime | APM, `nri-bundle`, Synthetics — [RFC 0004](./rfcs/0004-observabilidade-new-relic.md) |
| Alertas para falhas no processamento de OS | Política de alertas por ambiente (erros em rotas de OS/orçamentos, falhas de integração) |
| Logs JSON com correlação | `request_id` do gateway em todos os logs — [ADR 0005](./adrs/0005-logs-json-correlation-id.md) |
| Dashboards: volume diário de OS, tempo médio por status, erros de integração | Dashboard Negócio (módulo `observability` do infra-k8s) |
| Diagrama de componentes e de sequência | [arquitetura.md](./arquitetura.md) |
| RFCs e ADRs | [rfcs/](./rfcs), [adrs/](./adrs) |
| Justificativa do banco, ER e relacionamentos | [modelo-dados.md](./modelo-dados.md) |
| Dockerfiles, pipelines, README com propósito, tecnologias, execução, diagrama, Swagger/Postman | README de cada repositório; `Dockerfile` da aplicação |
| Notificações serverless (desafio) | Proposta de evolução — [RFC 0005](./rfcs/0005-notificacoes-serverless.md) |
