# ADR 0002 — Escalabilidade horizontal da API com HPA

- **Status:** aceito
- **Data:** 2026-11-13

## Contexto

A demanda da oficina varia ao longo do dia (picos na abertura e na entrega de veículos). A API
é stateless — sessão no JWT e estado no RDS —, então pode ter réplicas adicionadas e removidas
sem coordenação.

## Decisão

- **HorizontalPodAutoscaler** (`autoscaling/v2`) no Deployment da API, com alvo de **70% de CPU**
  e **80% de memória** sobre os requests do container.
- Limites por ambiente nos overlays Kustomize: **hml 1 a 2** réplicas, **prd 2 a 4** (duas no
  mínimo para tolerar a perda de um node).
- Requests de **100m de CPU e 256Mi de memória**, limits de 500m e 512Mi. O request de memória
  foi ajustado de 192Mi para 256Mi depois de observar, em hml, a API ociosa usando cerca de
  160Mi, o que mantinha o HPA permanentemente no máximo.
- Startup, readiness e liveness probes em `/api/health`, que também verifica o banco: uma
  réplica só recebe tráfego quando está pronta.
- O **Metrics Server** é instalado pelo Terraform da plataforma; o node group escala de 2 a 4
  nós.

## Consequências

- A capacidade acompanha a carga sem intervenção; as réplicas e o uso de CPU e memória estão nos
  dashboards e há alerta para CPU acima de 80% do limit.
- Memória é um sinal fraco para Node.js (o heap raramente encolhe): o alvo de memória evita OOM
  sob carga, mas a CPU é o gatilho principal de escala.
- O RDS `db.t3.micro` tem limite de conexões; com 4 réplicas e o pool padrão do Prisma o total
  continua bem abaixo desse limite. Escalar além disso exigiria um RDS maior ou RDS Proxy.
