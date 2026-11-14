# RFC 0004 — Observabilidade: New Relic

- **Status:** aceita
- **Data:** 2026-11-13

## Contexto

A fase 3 exige monitoramento de latência, consumo de recursos (CPU e memória por pod e nó),
saúde da aplicação, logs estruturados com correlação, métricas de negócio (volume diário de
OS, tempo médio por status, erros de integração), dashboards e alertas. Os sinais vêm de três
fontes diferentes: a API no EKS, as Lambdas e o próprio cluster.

## Opções avaliadas

| Critério | New Relic | Datadog | CloudWatch + Container Insights + X-Ray |
| --- | --- | --- | --- |
| Custo para o projeto | Plano gratuito permanente (100 GB/mês, 1 usuário completo) | Trial de 14 dias | Pago por métrica, log e trace |
| APM Node.js e logs em contexto | Agente oficial, logs ligados a traces | Agente oficial | X-Ray SDK, correlação manual |
| Kubernetes | `nri-bundle` via Helm | Agente via Helm | Container Insights (exige IAM do lab) |
| Lambdas | Layer com extensão | Layer com extensão | Nativo |
| Dashboards e alertas como código | Provider Terraform oficial | Provider Terraform oficial | Terraform (AWS) |
| Eventos de negócio consultáveis | Custom events + NRQL | Métricas/eventos customizados | Métricas customizadas (EMF) |

## Decisão

**New Relic**, com tudo provisionado como código:

- **API:** agente Node.js (`newrelic.cjs`, ativado quando há license key), logs JSON do pino
  com `trace.id`, eventos `OrdemServicoStatusAlterada` (com tempo no status anterior) e
  `IntegracaoFalhou`, `noticeError` nas falhas; marcador de deployment a cada deploy.
- **Kubernetes:** `nri-bundle` instalado pelo Terraform da plataforma.
- **Lambdas:** layer `NewRelicNodeJS22X` com o wrapper ESM, configurada pelo Terraform.
- **Dashboards e alertas:** módulo `observability` do infra-k8s, por ambiente — dashboards
  Operacional e Negócio, monitor Synthetics em `/api/health` pelo gateway e política de alertas
  com notificação por e-mail.
- A aplicação depende de uma porta `Telemetry`, não do SDK do fornecedor, para que a troca de
  ferramenta fique localizada em um adaptador.

## Consequências

- **Positivas:** uma ferramenta para todos os sinais, sem custo; dashboards e alertas
  reprodutíveis e revisáveis em PR; correlação ponta a ponta pelo `request_id` e pelo trace.
- **Negativas e mitigação:**
  - Dependência de um SaaS externo: a porta `Telemetry` isola a aplicação; os logs JSON também
    seguem para o stdout dos pods e o access log do gateway fica no CloudWatch.
  - Duas chaves para gerenciar (license de ingestão e User key do Terraform): publicadas nos
    GitHub Environments por `bootstrap/github-newrelic.sh`, nunca versionadas.
  - Limite de ingestão do plano gratuito: `lowDataMode` no `nri-bundle` e logs de cluster
    desligados (os logs da API chegam pelo agente).
