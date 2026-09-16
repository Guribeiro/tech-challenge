# Tech Challenge - Fase 2: Arquitetura e Escalabilidade em Kubernetes

Repositório desenvolvido para o Tech Challenge da Pós-Tech em Software Architecture (FIAP). O projeto consiste em uma aplicação backend em NestJS integrada a um banco de dados PostgreSQL, orquestrada em um cluster Kubernetes local via Kind, provisionada com Infraestrutura como Código (Terraform) e automatizada com um pipeline de CI/CD em GitHub Actions.

---

## 🛠️ Tecnologias Utilizadas

* **Linguagem & Framework:** TypeScript, NestJS, Prisma ORM
* **Banco de Dados:** PostgreSQL
* **Orquestração Local:** Kubernetes (Kind)
* **Infraestrutura como Código (IaC):** Terraform
* **Automação:** Makefile, Docker & Docker Compose
* **CI/CD:** GitHub Actions (Lint, Unit/E2E Tests, Docker Build & Push)

---

## 🏗️ Arquitetura da Solução

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)** no backend. Na camada de infraestrutura, utilizamos o **Terraform** para provisionar de forma declarativa:
1. **Namespace dedicado** (`oficina-mecanica`).
2. **Secrets** para injeção segura da `DATABASE_URL`.
3. **Deployments e Services (NodePort)** para a API NestJS e o PostgreSQL.
4. **InitContainers** no deploy da aplicação para executar as migrações do Prisma de forma automatizada e segura antes de iniciar o container principal.
5. **Horizontal Pod Autoscaler (HPA)** configurado para escalabilidade dinâmica baseada em uso de CPU e Memória.

---

## ⚙️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua máquina (WSL/Linux ou macOS):
* [Docker](https://www.docker.com/) & Docker Compose
* [Kubernetes CLI (kubectl)](https://kubernetes.io/docs/tasks/tools/)
* [Kind (Kubernetes in Docker)](https://kind.sigs.k8s.io/)
* [Terraform](https://www.terraform.io/)
* [Make](https://www.gnu.org/software/make/)

---

## 🚀 Guia de Uso (Comandos do Makefile)

Para facilitar a experiência de desenvolvimento e testes (*Developer Experience*), toda a complexidade de comandos do Terraform, Docker e Kubernetes foi centralizada em um `Makefile`.

### 1. Subir a Infraestrutura e a Aplicação Completa
Este comando sobe o cluster Kind (caso não exista), aplica o Terraform (provisionando banco, secrets, deployment e HPA), realiza o build e o deploy da aplicação no cluster:
```bash
make up
```

### 2. Subir a Infraestrutura e a Aplicação Completa
Caso faça alterações no código da API e queira atualizar os pods no cluster sem destruir a infraestrutura base:
```bash
make build
```

### 3. Destruir o Ambiente (Limpeza Completa)
Para remover o cluster Kind, volumes e todos os recursos criados:
```bash
make down
```

## 🔄 Pipeline de CI/CD (GitHub Actions)

A automação está dividida em dois workflows no diretório .github/workflows/:

1. Quality & Tests (quality.yml): Executa o linter, os testes unitários e os testes E2E (isolando um banco PostgreSQL em container) a cada push ou pull request nas branches main e fase-2.

2. Docker Build & Push (docker-build.yml): Disparado automaticamente após o sucesso dos testes na branch principal, realizando o build da imagem e o envio autenticado para o Docker Hub com tags versionadas (latest e <github.sha>).



