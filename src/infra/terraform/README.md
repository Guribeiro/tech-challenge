# Infraestrutura como Código (IaC) - Terraform

Este módulo em Terraform é responsável por provisionar todo o ambiente de infraestrutura para o projeto da Oficina Mecânica, contemplando o cluster Kubernetes local (via Kind), o Banco de Dados, o ecossistema da aplicação em NestJS e as políticas de escalabilidade.

## 🛠️ Recursos Criados

A execução deste projeto automatiza a criação dos seguintes componentes:

### 1. Cluster Kubernetes Local (`kind_cluster`)
* **Cluster:** Cria um cluster gerenciado pelo Kind chamado `oficina-cluster`.
* **Mapeamento de Portas (`extraPortMappings`):** Expõe a porta `30000` do nó do Kubernetes para a máquina hospedeira (*host*) através de um `NodePort`.

### 2. Espaço de Trabalho (`kubernetes_namespace`)
* Cria um namespace isolado chamado `oficina-mecanica`.

### 3. Banco de Dados PostgreSQL 
* **Deployment & Service:** Provisiona o banco de dados principal e o serviço de rede interna (`5432`).

### 4. Camada de Aplicação & Escalabilidade (`modules/app`)
* **Secrets (`kubernetes_secret_v1`):** Injeção segura da `DATABASE_URL`.
* **Deployment da API NestJS:** Configurado com `InitContainers` para rodar as migrações automáticas do Prisma antes de iniciar a API.
* **Horizontal Pod Autoscaler (HPA):** Escalabilidade dinâmica baseada em limites de CPU (70%) e Memória (80%), variando de 2 a 5 réplicas.

---

## 📋 Pré-requisitos

Certifique-se de possuir as seguintes ferramentas instaladas:
* [Docker Desktop](https://www.docker.com/) (em execução).
* [Terraform](https://developer.hashicorp.com/terraform/downloads).
* [Kind (Kubernetes in Docker)](https://kind.sigs.k8s.io/).
* [kubectl](https://kubernetes.io/docs/tasks/tools/).
* [Make](https://www.gnu.org/software/make/).

---

## ⚙️ Como Aplicar a Infraestrutura

Você pode subir a infraestrutura completa de forma automatizada pela raiz do projeto utilizando o Makefile:
```bash
make up
```
__(O comando acima constrói e publica a imagem, executa o `terraform apply` usando essa mesma tag e valida o rollout do cluster).__

Ou, se preferir executar os comandos manualmente dentro da pasta `src/infra/terraform`:

```bash
cd src/infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Antes do `plan`, revise o arquivo `terraform.tfvars` e substitua os valores de exemplo. Ele é ignorado pelo Git porque contém credenciais do banco. O arquivo `tfplan` também é ignorado e deve ser recriado quando os valores ou a infraestrutura mudarem.

## 🧹 Como Destruir a Infraestrutura
Para remover toda a infraestrutura e o cluster Kind:

```bash
# Pela raiz do projeto:
make down

# Ou diretamente pelo Terraform:
cd src/infra/terraform && terraform destroy -auto-approve
```

Este Terraform provisiona o ambiente Kubernetes local via Kind. O cluster EKS do Learning Lab é criado separadamente pelo `eksctl`, utilizando os manifests e o script descritos em `docs/INFRASTRUCTURE.md`.

O estado do Terraform e os planos locais não devem ser versionados, pois podem conter dados de infraestrutura e valores sensíveis. Use `terraform.tfvars.example` como referência e forneça os valores reais por arquivo local ou variáveis de ambiente.
