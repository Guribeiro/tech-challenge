# Infraestrutura como Código (IaC) - Terraform

Este módulo em Terraform é responsável por provisionar todo o ambiente de infraestrutura base para o projeto da Oficina Mecânica, contemplando a criação do cluster Kubernetes local (via Kind) e o provisionamento do Banco de Dados.

## 🛠️ Recursos Criados

A execução deste projeto automatiza a criação dos seguintes componentes:

### 1. Cluster Kubernetes Local (`kind_cluster`)
* **Cluster:** Cria um cluster gerenciado pelo Kind chamado `oficina-cluster`.
* **Control-plane:** Configura um nó integrado ao Docker Desktop.
* **Mapeamento de Portas (`extraPortMappings`):** Expõe a porta `30000` do nó do Kubernetes para a máquina hospedeira (*host*), permitindo o acesso à aplicação pelo navegador sem necessidade de LoadBalancers de nuvem.

### 2. Espaço de Trabalho (`kubernetes_namespace`)
* Cria um namespace isolado chamado `oficina-mecanica` para garantir a organização lógica e segurança dos objetos da aplicação.

### 3. Banco de Dados PostgreSQL 
*(Provisionado via Provider do Kubernetes/Helm dentro do cluster)*
* **Deployment/StatefulSet:** Provisiona o banco de dados principal da aplicação (`oficina_db`).
* **Service:** Cria o serviço de rede interna (porta `5432`) para comunicação com o NestJS.
* **Configuração:** Injeta automaticamente os dados de acesso (usuário, senha e database) definidos nas variáveis.

---

## 📋 Pré-requisitos

Certifique-se de possuir as seguintes ferramentas instaladas em sua máquina:
* [Docker Desktop](https://www.docker.com/) (em execução).
* [Terraform](https://developer.hashicorp.com/terraform/downloads) (versão 1.0.0 ou superior).
* [Kind (Kubernetes in Docker)](https://kind.sigs.k8s.io/).
* [kubectl](https://kubernetes.io/docs/tasks/tools/) (para interagir com o cluster).

---

## ⚙️ Como Aplicar a Infraestrutura

Siga os passos abaixo no seu terminal para subir a infraestrutura completa:

1. **Acesse o diretório do Terraform:**
```bash
cd terraform
```

2. **Inicialize os provedores do Terraform:**
Este comando baixa os plugins necessários para rodar o projeto.
```bash
terraform init
```

3. **Visualize o plano de execução (Dry-run):**
Confira a lista de todos os recursos (Cluster + Banco de Dados) que serão criados na sua máquina.
```bash
terraform plan
```

4. **Aplique a infraestrutura:**
Execute a criação do ambiente. O processo levará alguns minutos enquanto o cluster sobe e a imagem do banco é baixada. Confirme digitando yes quando solicitado.
```bash
terraform apply
```

5. **Valide a criação dos recursos:**
Verifique se o cluster e os pods do banco de dados estão rodando corretamente:

```bash
kubectl cluster-info --context kind-oficina-cluster
kubectl get pods -n oficina-mecanica
```

## 🧹 Como Destruir a Infraestrutura
Para não ocupar recursos da sua máquina (memória/CPU), remova toda a infraestrutura com um único comando:

```bash
terraform destroy
```

_(Confirme a exclusão digitando yes quando solicitado. Isso excluirá o cluster Kind, o banco de dados e o namespace instantaneamente)._