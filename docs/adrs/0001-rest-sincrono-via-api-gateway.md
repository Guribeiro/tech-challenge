# ADR 0001 — Comunicação síncrona REST com entrada única pelo API Gateway

- **Status:** aceito
- **Data:** 2026-11-13

## Contexto

Clientes, recepção e mecânicos consomem a API por HTTP, e o próprio fluxo de negócio é
interativo: abrir uma OS, aprovar um orçamento, consultar a situação. A fase 3 introduz uma
função serverless de autenticação que precisa conviver com a API no EKS sob um mesmo endereço,
e a API não deve ficar exposta diretamente à internet.

## Decisão

- Toda comunicação externa é **REST síncrona sobre HTTPS** e entra por **uma HTTP API do API
  Gateway por ambiente**.
- A API NestJS não tem endereço público: o gateway a alcança por **VPC Link** até um **NLB
  interno** criado pelo Service do Kubernetes.
- O gateway roteia `POST /auth/cpf` para a Lambda, as rotas públicas direto para a API e
  `ANY /api/{proxy+}` para a API após o Lambda Authorizer.
- O gateway aplica throttling por stage, grava access log JSON e encaminha o seu `requestId`
  como `x-request-id`.
- Integrações assíncronas internas (notificações, reações a mudanças de status) continuam como
  **eventos de domínio em processo**; o webhook de pagamento chega por uma rota pública.

## Consequências

- Um único ponto para autenticação, limites de requisição, CORS e logs de acesso; a API e as
  Lambdas evoluem atrás dele sem mudar o endereço dos clientes.
- Latência adicional do gateway e do authorizer (este com cache de 300 s por token).
- O timeout de integração do HTTP API (29 s) limita operações longas; nenhuma rota atual chega
  perto disso. Se surgirem processamentos longos, a evolução é aceitar a requisição e processar
  de forma assíncrona (fila), sem mudar este contrato de entrada.
