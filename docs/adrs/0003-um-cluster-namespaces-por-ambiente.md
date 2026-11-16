# ADR 0003 — Um cluster EKS com um namespace por ambiente

- **Status:** aceito
- **Data:** 2026-11-13

## Contexto

São exigidos ambientes de homologação e produção. Cada cluster EKS custa US$ 0,10/h só pelo
control plane, além de nodes e NAT, e o crédito do Learner Lab é limitado.

## Decisão

- **Um cluster** (`oficina-eks`, stack `platform` do infra-k8s) com os namespaces
  **`oficina-hml`** e **`oficina-prd`**.
- Isolamento do que importa por ambiente: **HTTP API, NLB interno, RDS, segredos (banco e JWT),
  Lambdas, dashboards e alertas** são separados.
- A plataforma compartilhada só é alterada a partir da `main`, após revisão; os recursos de
  cada ambiente são aplicados pela `develop` (hml) e pela `main` (prd).

## Consequências

- Metade do custo fixo de dois clusters; um único conjunto de add-ons (Metrics Server, New
  Relic) para operar.
- Isolamento mais fraco que clusters separados: os ambientes dividem nodes, versão do
  Kubernetes e add-ons, e uma falha da plataforma afeta os dois. Mitigação: limites de recursos
  por pod, HPA com máximos, namespaces e segredos distintos.
- Em produção real, a evolução é um cluster (ou conta) por ambiente; a separação em stacks
  `platform` e `environment` já permite isso sem reescrever os módulos.
