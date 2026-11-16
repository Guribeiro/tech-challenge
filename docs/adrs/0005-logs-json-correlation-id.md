# ADR 0005 — Logs estruturados em JSON com correlation id

- **Status:** aceito
- **Data:** 2026-11-13

## Contexto

Uma requisição passa pelo API Gateway, pelo authorizer, às vezes pela Lambda de autenticação,
e pela API, que gera logs em controllers, casos de uso e subscribers de eventos. Com logs em
texto livre e sem identificador comum, não é possível reconstruir o caminho de uma requisição
nem filtrar por usuário.

## Decisão

- A API registra logs em **JSON** com **pino** (`nestjs-pino`), substituindo o logger padrão do
  NestJS; a Lambda usa o mesmo formato.
- Campos comuns: `timestamp`, `level`, `service`, `env`, `message` e **`request_id`**; no log de
  conclusão, também `req`, `res.status_code`, `duration_ms`, `user_id` e `user_role`.
- O **`request_id`** é o `requestId` do API Gateway, encaminhado como `x-request-id`; sem
  gateway (desenvolvimento local), a API gera um UUID. Ele volta no cabeçalho de resposta.
- O logger da requisição carrega só o `request_id` e é herdado por todo log emitido durante
  ela, inclusive pelos `Logger` do NestJS nos casos de uso.
- Dados sensíveis são removidos (`authorization`, `cookie`, senha, CPF, documento) e o CPF é
  mascarado na Lambda.
- Com o agente New Relic ativo, os logs recebem `trace.id`/`span.id` (logs in context).

## Consequências

- A partir de um `request_id` é possível ligar o access log do gateway, o log da Lambda, todas
  as linhas da API e o trace no New Relic.
- Logs em JSON são consultáveis por campo no New Relic (`FROM Log WHERE request_id = ...`).
- Um defeito encontrado em hml — o `request_id` saía duplicado no log de conclusão, porque o
  pino-http aplica `customProps` sobre o logger que já tinha a chave — foi corrigido e está
  coberto por teste com requisição HTTP real (`src/infra/logging/testes`).
