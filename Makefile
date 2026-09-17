.PHONY: up down stop start build migrate status logs help

DOCKER_USER    = guribeiro
IMAGE_NAME     = $(DOCKER_USER)/oficina-app:latest
CLUSTER_NAME   = oficina-cluster
NAMESPACE      = oficina-mecanica
APP_DEPLOYMENT = oficina-app-deployment
TERRAFORM_DIR = src/infra/terraform

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
	@echo "==> 1/5 Gerando imagem Docker local..."
	docker build -t $(IMAGE_NAME) .
	@echo "==> 2/5 Enviando imagem para o Docker Hub..."
	docker push $(IMAGE_NAME)
	@echo "==> 3/5 Subindo infraestrutura via Terraform..."
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve
	@echo "==> 4/5 Aguardando inicialização dos pods..."
	kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE) --timeout=120s
	@echo "\n🚀 Aplicação pronta! Acesse em: http://localhost:30000"

# Reconstrução rápida da imagem Docker e deploy sem reiniciar o cluster
build:
	@echo "==> Reconstruindo e enviando imagem Docker..."
	docker build -t $(IMAGE_NAME) .
	docker push $(IMAGE_NAME)
	@echo "==> Reiniciando Deployment no K8s..."
	kubectl rollout restart deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE)
	kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE)

# Executa as migrações do Prisma no K8s
migrate:
	@echo "==> Executando 'npx prisma migrate deploy'..."
	kubectl exec deployment/$(APP_DEPLOYMENT) -n $(NAMESPACE) -- sh -c 'npx prisma migrate deploy'

# Pausa os containers do cluster sem deletar nada
stop:
	@echo "==> Pausando containers do cluster Kind..."
	docker stop $$(docker ps -q -f name=$(CLUSTER_NAME))

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
	@kind delete cluster --name $(CLUSTER_NAME) 2>/dev/null || true

# Status dos pods
status:
	kubectl get pods -n $(NAMESPACE)

# Logs da API em tempo real
logs:
	kubectl logs -l app=oficina-app -n $(NAMESPACE) -f --tail=50