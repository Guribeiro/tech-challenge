# Roteiro do vídeo de demonstração

Meta: **cerca de 10 minutos depois da edição**. As esperas (checks do PR, build e deploy)
acontecem em paralelo com outras demonstrações e são cortadas — os pontos de corte estão
marcados com ✂️.

Itens exigidos e onde aparecem: autenticação com CPF (bloco 3), execução da pipeline CI/CD
(blocos 2 e 5), deploy automatizado (blocos 5 e 8), consumo das APIs protegidas (bloco 4),
dashboard com análise ao vivo (bloco 6), logs e traces (bloco 7).

---

## 0. Preparação (fora do vídeo)

### 0.1 Ambiente e ferramentas

```bash
sudo apt install -y jq                      # usado para ler as respostas JSON

export AWS_PROFILE=learnerlab
export HML=https://0bagr12oql.execute-api.us-east-1.amazonaws.com
aws sts get-caller-identity --query Account --output text      # 768022868381
aws eks update-kubeconfig --name oficina-eks --region us-east-1
kubectl get pods -n oficina-hml                                 # 1/1 Running
curl -s $HML/api/health | jq .status                            # "ok"
```

> Se a sessão do Learner Lab for nova, as URLs mudam: rode antes o `scripts/bringup.sh` e
> `bootstrap/github-secrets.sh` (infra-k8s) e use as URLs impressas pelo bringup.

### 0.2 Funções de apoio (cole no terminal que vai aparecer no vídeo)

```bash
# Mostra o payload de um JWT
jwt() { local p; p=$(cut -d. -f2 <<<"$1" | tr '_-' '/+'); while (( ${#p} % 4 )); do p+="="; done; base64 -d <<<"$p" | jq; }

# Autentica por CPF e mostra status + corpo
auth() { curl -s -w '\nHTTP %{http_code}\n' -X POST $HML/auth/cpf -H 'content-type: application/json' -d "{\"cpf\":\"$1\"}"; }
```

### 0.3 IDs para abrir a OS (fora do vídeo)

```bash
TF=$(curl -s -X POST $HML/api/sessions/sign-in -H 'content-type: application/json' \
  -d '{"email":"maria.recepcao@oficina.com","senha":"senha123"}' | jq -r .accessToken)
CLIENTE_ID=$(curl -s -X POST $HML/auth/cpf -H 'content-type: application/json' -d '{"cpf":"52998224725"}' | jq -r .cliente.id)
VEICULO_ID=$(curl -s "$HML/api/veiculos?pagina=1&limite=100" -H "authorization: Bearer $TF" \
  | jq -r --arg c "$CLIENTE_ID" '[.veiculos[] | select(.clienteId == $c)][0].id')
SERVICO_ID=$(curl -s "$HML/api/servicos?pagina=1&limite=1" -H "authorization: Bearer $TF" | jq -r '.servicos[0].id')
PRODUTO_ID=$(curl -s "$HML/api/produtos?pagina=1&limite=100" -H "authorization: Bearer $TF" \
  | jq -r '[.produtos[] | select(.quantidadeDisponivel > 0)][0].id')
echo "$VEICULO_ID $SERVICO_ID $PRODUTO_ID"     # os três precisam estar preenchidos
```

### 0.4 Tráfego para os dashboards terem dados

```bash
cd ~/www/tech-challenge
npx newman run docs/postman/oficina-fase3.postman_collection.json -n 5 --env-var baseUrl=$HML
```

### 0.5 Alteração que vai disparar a pipeline

```bash
cd ~/www/tech-challenge
git switch develop && git pull
git switch -c demo/video
sed -i 's/^# 🛠️ FIAP Tech Challenge - Oficina Mecânica$/# 🛠️ FIAP Tech Challenge - Oficina Mecânica (Fase 3)/' README.md
git commit -am "docs: titulo da fase 3 no README"
```

### 0.6 Abas abertas no navegador

1. Diagrama de componentes: https://github.com/Guribeiro/tech-challenge/blob/main/docs/arquitetura.md
2. GitHub Actions: https://github.com/Guribeiro/tech-challenge/actions
3. New Relic — Dashboard Operacional (hml): https://one.newrelic.com/redirect/entity/ODczNjQzMnxWSVp8REFTSEJPQVJEfGRhOjEzNTc1NDg0
4. New Relic — Dashboard Negócio (hml): https://one.newrelic.com/redirect/entity/ODczNjQzMnxWSVp8REFTSEJPQVJEfGRhOjEzNTc1NDg1
5. New Relic — APM `oficina-app-hml`: https://one.newrelic.com/redirect/entity/ODczNjQzMnxBUE18QVBQTElDQVRJT058NjI2NzQxNjIz
6. New Relic — Logs: https://one.newrelic.com/logger
7. AWS Console — API Gateway (`oficina-api-hml`) e Lambda (`oficina-auth-cpf-hml`)

---

## 1. Abertura — 0:00 a 0:40

**Tela:** diagrama de componentes (aba 1).

> "Olá, eu sou o Gustavo e este é o Tech Challenge da Fase 3 da oficina mecânica. Nesta fase
> a aplicação foi levada para uma arquitetura corporativa na AWS: toda requisição entra por um
> API Gateway; a autenticação do cliente por CPF é feita por uma função Lambda; as rotas
> protegidas passam por um Lambda Authorizer; a API NestJS roda no EKS com autoescala; os dados
> ficam em um RDS PostgreSQL; e tudo é monitorado no New Relic. O código está em quatro
> repositórios — a Lambda, a infraestrutura do Kubernetes, a do banco e a aplicação — todos com
> Terraform e pipelines que publicam em homologação e produção."

---

## 2. Pipeline — proteção da main e abertura do PR — 0:40 a 1:50

**Tela:** terminal.

> "Começo pelo fluxo de entrega. A branch main é protegida: se eu tentar enviar um commit
> direto para ela, o GitHub recusa."

```bash
git push origin demo/video:main
```

**Mostrar:** a mensagem `protected branch hook declined` / `Changes must be made through a pull request`.

> "Toda mudança entra por pull request. Vou abrir um PR para a develop, que é a branch de
> homologação."

```bash
git push -u origin demo/video
gh pr create --base develop --title "docs: titulo da fase 3 no README" --body "Demonstração do pipeline"
gh pr checks --watch
```

**Tela:** aba do PR no navegador, checks rodando.

> "O PR só pode ser mergeado com lint, testes unitários e testes end-to-end aprovados.
> Enquanto eles rodam, vou mostrar a autenticação."

✂️ **Corte** — deixe os checks rodando.

---

## 3. Autenticação com CPF — 1:50 a 3:30

**Tela:** terminal.

> "O cliente se autentica só com o CPF, pela rota POST /auth/cpf do API Gateway, que chama a
> Lambda. Ela valida os dígitos verificadores, consulta o cliente no RDS, verifica o status e
> devolve um JWT. Primeiro, um cliente ativo — o CPF pode vir com ou sem pontuação."

```bash
auth 529.982.247-25
```

**Mostrar:** `HTTP 200`, `accessToken`, `expiresIn: 3600`, nome do cliente.

```bash
TOKEN=$(curl -s -X POST $HML/auth/cpf -H 'content-type: application/json' -d '{"cpf":"52998224725"}' | jq -r .accessToken)
jwt $TOKEN
```

> "O token carrega o id do cliente, o perfil CLIENTE e o CPF, e vale por uma hora. Agora os
> casos de erro: um cliente bloqueado e um inativo recebem 403, um CPF válido que não está
> cadastrado recebe 404, e um CPF inválido recebe 400."

```bash
auth 11144477735
auth 93541134780
auth 12345678909
auth 123
```

**Tela:** AWS Console → Lambda `oficina-auth-cpf-hml` (só mostrar rapidamente).

> "Essa é a função no console da AWS, criada por Terraform no repositório oficina-lambda-auth,
> junto com o authorizer."

---

## 4. Consumo das APIs protegidas — 3:30 a 5:00

**Tela:** terminal.

> "Agora o consumo das rotas protegidas. Sem token, o próprio API Gateway recusa com 401."

```bash
curl -s -o /dev/null -w 'HTTP %{http_code}\n' $HML/api/clientes
```

> "Com um token falso, quem recusa é o Lambda Authorizer, com 403."

```bash
curl -s -o /dev/null -w 'HTTP %{http_code}\n' $HML/api/clientes -H 'authorization: Bearer abc.def.ghi'
```

> "Com o token do cliente, ele abre uma ordem de serviço para o próprio veículo. Repare no
> cabeçalho x-request-id: é o identificador do API Gateway, que vou usar para rastrear essa
> requisição nos logs."

```bash
curl -s -D /tmp/headers.txt -X POST $HML/api/ordens-servicos \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"veiculoId\":\"$VEICULO_ID\",\"descricao\":\"Revisão com troca de óleo\",\"eGarantia\":false,\"servicos\":[{\"servicoId\":\"$SERVICO_ID\"}],\"componentes\":[{\"produtoId\":\"$PRODUTO_ID\",\"quantidade\":1}]}" \
  | jq '{id, status, clienteId}'
REQ_ID=$(grep -i '^x-request-id' /tmp/headers.txt | cut -d' ' -f2 | tr -d '\r'); echo "x-request-id: $REQ_ID"
```

**Mostrar:** OS com `status: RECEBIDA` e o `x-request-id`.

> "E o mesmo token de cliente numa rota de funcionário é recusado pela própria API, que
> revalida o token e aplica o perfil de cada rota."

```bash
curl -s $HML/api/clientes -H "authorization: Bearer $TOKEN" | jq .message
```

---

## 5. Pipeline — merge e deploy automático — 5:00 a 5:50

**Tela:** aba do PR (checks verdes).

> "Os checks passaram. Vou fazer o merge na develop."

```bash
gh pr merge --merge
```

**Tela:** aba do GitHub Actions.

> "O merge dispara o pipeline: primeiro o Quality, com lint e testes; depois o build da imagem
> Docker, que é enviada para o ECR com a tag do commit; e, no mesmo fluxo, o deploy no EKS —
> develop vai para homologação e main para produção. O deploy cria o Secret a partir do Secrets
> Manager, roda as migrations no RDS, faz o rollout e um smoke test, e registra o deploy no
> New Relic. Enquanto ele roda, vamos ao monitoramento."

✂️ **Corte** — deixe o pipeline rodando (cerca de 8 minutos).

---

## 6. Monitoramento ao vivo — 5:50 a 7:40

**Tela:** Dashboard Operacional (aba 3). Escolha "Since 30 minutes ago".

> "Este é o dashboard operacional de homologação, criado por Terraform. Aqui está o throughput,
> a taxa de erro e a latência p50, p95 e p99 por rota — a abertura de OS que acabamos de fazer
> aparece aqui. Na página de Kubernetes, o consumo de CPU e memória por pod e por nó e as
> réplicas do HPA. E na página de autenticação, as invocações, a duração e os erros das Lambdas
> e o health check feito pelo monitor sintético a cada 15 minutos."

**Tela:** Dashboard Negócio (aba 4).

> "O dashboard de negócio mostra o volume diário de ordens de serviço, o tempo médio em cada
> status — diagnóstico, execução e finalização — e as falhas de integração. Esses dados vêm de
> eventos que a própria aplicação envia ao New Relic a cada mudança de status."

**Tela:** New Relic → Alerts → Alert Policies → "Oficina Mecanica (hml) - Alertas".

> "E há uma política de alertas: taxa de erro acima de 5%, p95 acima de um segundo, CPU alta,
> reinício de pod, erros no processamento de ordens de serviço, falhas de integração, erros nas
> Lambdas e indisponibilidade do health check, com notificação por e-mail."

---

## 7. Logs e traces — 7:40 a 9:00

**Tela:** terminal, depois New Relic Logs (aba 6).

```bash
echo $REQ_ID
```

> "Os logs da aplicação são JSON estruturado e carregam o request_id que veio do API Gateway.
> Filtrando por ele, vejo todas as linhas daquela requisição de abertura de OS."

**No New Relic Logs**, consulta: `request_id:"<valor do REQ_ID>"` → abrir uma linha e mostrar os
campos `request_id`, `user_id`, `user_role`, `duration_ms`, `trace.id`.

> "Cada linha também tem o trace.id, que liga o log ao trace no APM."

**Tela:** APM `oficina-app-hml` (aba 5) → *Distributed tracing* (ou *Transactions* →
`POST /api/ordens-servicos`) → abrir um trace.

> "No trace da abertura de OS dá para ver quanto tempo foi gasto em cada etapa, inclusive nas
> consultas ao PostgreSQL."

**Opcional (terminal)**, o mesmo request id no access log do gateway (o CloudWatch leva até
um minuto para receber o registro):

```bash
aws logs filter-log-events --log-group-name /aws/apigateway/oficina-api-hml \
  --filter-pattern "\"$REQ_ID\"" --query 'events[].message' --output text | jq
```

> "E o mesmo identificador aparece no access log do API Gateway, no CloudWatch — é assim que
> se correlaciona a requisição de ponta a ponta."

✂️ **Corte** — se o pipeline ainda não terminou, espere.

---

## 8. Deploy automatizado concluído — 9:00 a 9:50

**Tela:** GitHub Actions, run "Docker Build & Push" verde com os jobs `build-and-push` e
`deploy / Deploy (hml)`.

> "O pipeline terminou: a imagem foi construída e publicada, e o deploy em homologação foi
> concluído com o smoke test."

```bash
kubectl get deploy oficina-app-deployment -n oficina-hml \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
git log origin/develop --oneline -1
kubectl get pods,hpa -n oficina-hml
```

> "O cluster já está rodando a imagem com o SHA do commit que acabei de mergear."

**Tela:** APM `oficina-app-hml` → *Deployments* (ou o marcador no gráfico de throughput).

> "E o deploy aparece registrado no New Relic, com a versão e o link do pipeline. Para
> produção, o fluxo é o mesmo a partir de um PR da develop para a main."

---

## 9. Fechamento — 9:50 a 10:20

**Tela:** README do tech-challenge (seção Arquitetura, com links para RFCs e ADRs).

> "Toda a infraestrutura é criada por Terraform nos três repositórios de infra, e as decisões
> estão documentadas em RFCs e ADRs, junto com o modelo de dados e os diagramas. Obrigado!"

---

## Depois de gravar

```bash
# Opcional: desfazer a alteração de demonstração em outro PR, ou mantê-la.
cd ~/www/oficina-infra-k8s && ./scripts/teardown.sh    # quando terminar a sessão
```

Depois: **End Lab** no Learner Lab, subir o vídeo (YouTube/Vimeo, público ou não listado) e
preencher o link em `docs/entrega.md` para gerar o PDF.
