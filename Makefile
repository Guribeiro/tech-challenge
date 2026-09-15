.PHONY: up down stop start build migrate status logs help

CLUSTER_NAME   = oficina-cluster
NAMESPACE      = oficina-mecanica
APP_DEPLOYMENT = oficina-app-deployment
IMAGE_NAME     = oficina-app:latest
TERRAFORM_DIR  = terraform

# Help / Menu de Ajuda
help:
	@echo "Comandos disponíveis:"
	@echo "  make up       - Sobe a infra (Terraform), gera a imagem Docker, carrega no Kind e roda as migrations"
	@echo "  make down     - Destrói toda a infraestrutura criada via Terraform"
	@echo "  make stop     - Pausa o cluster (Docker stop) sem perder dados"
	@echo "  make start    - Retoma o cluster previamente pausado"
	@echo "  make build    - Recompila a imagem e atualiza os pods no K8s"
	@echo "  make migrate  - Executa as migrations do Prisma no Kubernetes"
	@echo "  make status   - Exibe o status atual dos Pods"
	@echo "  make logs     - Exibe os logs em tempo real da API NestJS"

# Sobe toda a infraestrutura e a aplicação
up:
	@echo "==> 1/5 Subindo infraestrutura via Terraform..."
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve
	@echo "==> 2/5 Gerando imagem Docker local..."
	docker build -t $(IMAGE_NAME) .
	@echo "==> 3/5 Carregando imagem no cluster Kind..."
	kind load docker-image $(IMAGE_NAME) --name $(CLUSTER_NAME)
	@echo "==> 4/5 Aguardando inicialização dos pods..."
	kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE) --timeout=120s
	@echo "==> 5/5 Executando migrations do Prisma..."
	@$(MAKE) migrate
	@echo "\n🚀 Aplicação pronta! Acesse em: http://localhost:30000"

# Reconstrução rápida da imagem Docker e deploy sem reiniciar o cluster
build:
	@echo "==> Reconstruindo imagem Docker..."
	docker build -t $(IMAGE_NAME) .
	@echo "==> Atualizando imagem no cluster Kind..."
	kind load docker-image $(IMAGE_NAME) --name $(CLUSTER_NAME)
	@echo "==> Reiniciando Deployment..."
	kubectl rollout restart deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE)
	kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE)

# Executa as migrações do Prisma no K8s
migrate:
	@echo "==> Executando 'npx prisma migrate deploy'..."
	kubectl exec -it deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE) -- sh -c 'npx prisma migrate deploy'

# Pausa os containers do cluster sem deletar nada
stop:
	@echo "==> Pausando containers do cluster Kind..."
	docker stop $$(docker ps -q -f name=$(CLUSTER_NAME))

# Retoma os containers pausados
# Retoma os containers pausados
start:
	@echo "==> Retomando containers do cluster Kind..."
	docker start $$(docker ps -a -q -f name=$(CLUSTER_NAME))
	@echo "==> Aguardando o Control Plane do Kubernetes inicializar (15s)..."
	@sleep 15
	@echo "==> Aguardando serviços ficarem online..."
	kubectl get pods -n $(NAMESPACE)

# Destrói o cluster e limpa recursos
down:
	@echo "==> Destruindo infraestrutura via Terraform..."
	cd $(TERRAFORM_DIR) && terraform destroy -auto-approve

# Status dos pods
status:
	kubectl get pods -n $(NAMESPACE)

# Logs da API em tempo real
logs:
	kubectl logs -l app=oficina-app -n $(NAMESPACE) -f --tail=50