# Roteiro do vídeo de demonstração (até 15 minutos)

Itens exigidos: autenticação com CPF, execução da pipeline CI/CD, deploy automatizado,
consumo das APIs protegidas, dashboard de monitoramento com análise ao vivo, logs e traces.

## Preparação (antes de gravar, fora do vídeo)

1. Nova sessão do Learner Lab, credenciais no perfil `learnerlab`,
   `./bootstrap/github-secrets.sh` e `./scripts/bringup.sh` no infra-k8s
   ([guia](https://github.com/Guribeiro/oficina-infra-k8s/blob/main/docs/learner-lab.md)).
2. Anotar as URLs impressas pelo `bringup.sh` e atualizar `docs/entrega.md`.
3. Gerar tráfego para os dashboards terem dados (a coleção Postman algumas vezes):
   ```bash
   npx newman run docs/postman/oficina-fase3.postman_collection.json -n 5 --env-var baseUrl=<URL hml>
   ```
4. Preparar uma alteração pequena em um branch (ex.: texto do README ou da descrição no
   Swagger) com PR aberto para `develop`, para disparar a pipeline durante a gravação.
5. Abas abertas: GitHub (PR e Actions), Postman, New Relic (APM `oficina-app-hml`, dashboards
   Operacional e Negócio, Logs), AWS Console (API Gateway, Lambda, EKS, RDS).

O pipeline completo (Quality → build → deploy) leva cerca de 10 minutos: dispare-o no início
e volte a ele no fim, ou corte a espera na edição.

## Roteiro

| Tempo | Bloco | O que mostrar |
| --- | --- | --- |
| 0:00–1:00 | Abertura | Objetivo da fase e diagrama de componentes (`docs/arquitetura.md`): API Gateway → Lambdas → EKS → RDS, New Relic, 4 repositórios |
| 1:00–3:00 | Pipeline CI/CD e deploy automatizado (início) | PR aberto para `develop`: checks obrigatórios (lint, unitários, e2e) e `main` protegida (tentativa de push direto recusada). Fazer o merge e mostrar no Actions o Quality → Docker Build & Push → Deploy disparando |
| 3:00–5:30 | Autenticação com CPF | Postman: `POST /auth/cpf` com o CPF ativo (200 + token, decodificar o payload em jwt.io mostrando `role: CLIENTE`), bloqueado/inativo (403), inexistente (404) e inválido (400). Mostrar no console a Lambda `oficina-auth-cpf-hml` e o código da validação |
| 5:30–7:30 | Consumo das APIs protegidas | Sem token (401), token inválido (403 do authorizer), token do cliente abrindo OS (201, OS do próprio cliente), token de cliente em rota de funcionário (403 da API), rastreio público. Mostrar o authorizer anexado às rotas no API Gateway |
| 7:30–10:30 | Monitoramento ao vivo | New Relic: dashboard Operacional (latência p50/p95/p99 por rota, throughput, erros, CPU/memória por pod, réplicas do HPA, Lambdas), dashboard Negócio (OS do dia, tempo médio por status, falhas de integração), monitor de disponibilidade e política de alertas |
| 10:30–12:30 | Logs e traces | Copiar o `x-request-id` de uma resposta da abertura de OS; em New Relic Logs, filtrar por `request_id` e mostrar as linhas JSON da API; abrir o trace da transação (APM → Transactions) com o tempo gasto no banco; mostrar o mesmo `requestId` no access log do gateway (CloudWatch) |
| 12:30–14:00 | Deploy automatizado (conclusão) | Voltar ao Actions: deploy concluído (migration, rollout, smoke test), pods novos no namespace `oficina-hml` (`kubectl get pods -n oficina-hml`) e o marcador de deployment no APM do New Relic |
| 14:00–15:00 | Fechamento | Infraestrutura em Terraform nos 3 repositórios de infra, documentação (RFCs, ADRs, ER) e scripts de bringup/teardown |

## Comandos úteis durante a gravação

```bash
export AWS_PROFILE=learnerlab
aws eks update-kubeconfig --name oficina-eks --region us-east-1
kubectl get pods,hpa -n oficina-hml
kubectl logs -n oficina-hml -l app=oficina-app --tail=5

# Logs da Lambda de autenticação
aws logs tail /aws/lambda/oficina-auth-cpf-hml --since 10m

# Access log do gateway filtrando por request id
aws logs filter-log-events --log-group-name /aws/apigateway/oficina-api-hml \
  --filter-pattern '"<request-id>"' --query 'events[].message'
```

NRQL para mostrar ao vivo:

```sql
SELECT count(*) FROM Transaction WHERE appName = 'oficina-app-hml' FACET name SINCE 30 minutes ago
SELECT * FROM Log WHERE request_id = '<request-id>' SINCE 1 hour ago
SELECT count(*) FROM OrdemServicoStatusAlterada FACET statusNovo SINCE today
```

## Ao terminar

`./scripts/teardown.sh` no infra-k8s e **End Lab**.
