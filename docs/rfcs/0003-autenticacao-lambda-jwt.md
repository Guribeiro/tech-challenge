# RFC 0003 — Autenticação de clientes por CPF: Lambda + JWT + Lambda Authorizer

- **Status:** aceita
- **Data:** 2026-11-13

## Contexto

Clientes da oficina precisam se identificar apenas pelo CPF para acompanhar e abrir ordens de
serviço, sem cadastro de senha. A fase 3 exige que essa autenticação seja uma **função
serverless** atrás do **API Gateway**, consultando o cliente e seu status, e que o token
emitido proteja as rotas da API. Funcionários já autenticam por e-mail e senha na própria
API (`POST /api/sessions/sign-in`, JWT HS256).

## Opções avaliadas

| Critério | Lambda própria + JWT HS256 + Lambda Authorizer | Amazon Cognito (custom auth) | Autenticação apenas na API |
| --- | --- | --- | --- |
| Atende "função serverless" | Sim | Parcial (triggers Lambda) | Não |
| Login só com CPF | Simples (regra própria) | Fluxo custom challenge com 3 triggers | Simples |
| Status do cliente no banco | Consulta direta ao RDS | Sincronização com o user pool | Consulta direta |
| Tokens de funcionários existentes | Mesmo segredo, mesmo formato | Dois emissores e formatos | Mesmo formato |
| Permissões no Learner Lab | `LabRole` basta | User pool e roles extras | — |

## Decisão

1. **Lambda `auth-cpf`** (`POST /auth/cpf`, Node.js 22 + TypeScript):
   - normaliza o CPF e valida os dígitos verificadores (400 se inválido);
   - busca o cliente por `documento` no RDS (404 se inexistente);
   - recusa cliente `INATIVO` ou `BLOQUEADO` (403);
   - emite JWT **HS256** `{ sub: <id do cliente>, role: "CLIENTE", cpf }`, válido por 1 hora;
   - erros inesperados viram 500 sem detalhes internos; logs JSON com CPF mascarado.
2. **Lambda `authorizer`** (Lambda Authorizer de payload 2.0 com respostas simples) nas rotas
   `ANY /api/{proxy+}`: valida assinatura, expiração, algoritmo (recusa `alg: none`) e perfil
   conhecido; aceita tokens de clientes e de funcionários; cache de 300 s por token.
3. **Segredo compartilhado por ambiente** no Secrets Manager (`oficina/<env>/jwt`), usado pela
   Lambda para assinar e pela API e pelo authorizer para validar.
4. A **API continua validando** o token (Passport JWT) e aplicando os perfis por rota
   (`RolesGuard`): o authorizer é uma barreira adicional, não a única.

## Consequências

- **Positivas:** fluxo simples e testável (unitários, integração com Postgres e um teste ponta a
  ponta local que valida o token na API real); um único formato de token para clientes e
  funcionários; requisições inválidas barradas no gateway, antes de consumir a API.
- **Negativas e mitigação:**
  - Segredo simétrico compartilhado por três componentes: isolado por ambiente (token de hml é
    recusado em prd) e restrito ao Secrets Manager. Evolução natural: RS256 com a chave
    privada só na Lambda e JWKS para os validadores.
  - Revogação só por expiração (1 h) ou mudança de status no próximo login; o cache de 300 s do
    authorizer atrasa a recusa de um token por até 5 minutos.
  - CPF como único fator é adequado para consulta e abertura de OS, não para operações
    sensíveis; essas continuam restritas a funcionários.
