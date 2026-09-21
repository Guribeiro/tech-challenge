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

2. Docker Build & Push (docker-build.yml): Disparado automaticamente após o sucesso dos testes nas branches `main` e `fase-2`, realizando o build da imagem e o envio autenticado para o Docker Hub e para o Amazon ECR com as tags `latest` e `<github.sha>`.
3. Deploy to EKS (deploy-eks.yml): Disparado após o sucesso do build na branch `main`, atualiza o kubeconfig, aplica os manifests do EKS, executa as migrations e aguarda o rollout da API usando a imagem versionada pelo SHA do commit.

Para habilitar o push no ECR usando as credenciais temporárias do AWS Learning Lab, configure no repositório do GitHub:

- Secret `AWS_ACCESS_KEY_ID`: access key fornecida pelo Learning Lab.
- Secret `AWS_SECRET_ACCESS_KEY`: secret key fornecida pelo Learning Lab.
- Secret `AWS_SESSION_TOKEN`: session token fornecido pelo Learning Lab; ele é obrigatório para credenciais temporárias.
- Variables `AWS_REGION` e `ECR_REPOSITORY` (opcionais; os valores padrão são `us-east-1` e `oficina-app`).
- Variable `EKS_CLUSTER` (opcional; o valor padrão é `oficina-eks`).
- Um repositório ECR previamente criado com o mesmo nome de `ECR_REPOSITORY`.

As credenciais do Learning Lab expiram e precisam ser atualizadas nos GitHub Secrets a cada rotação. O workflow usa as permissões ECR já associadas à sessão do laboratório; não é necessário criar ou alterar uma role IAM para OIDC.

Para o workflow de deploy, configure também os Secrets `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `JWT_SECRET`. O cluster EKS precisa existir antes da execução do workflow; sua criação continua sendo feita pelo `make eks-up`/`eksctl`, enquanto novas versões na `main` são publicadas automaticamente.

## Deploy no AWS EKS Learning Lab

O fluxo EKS fica separado do ambiente Kind e usa ECR para armazenar a imagem. No Learning Lab, o PostgreSQL usa armazenamento efêmero (`emptyDir`) porque a role fornecida aos nodes não possui as permissões EC2 necessárias para o EBS CSI. Isso é suficiente para demonstrações acadêmicas, mas os dados são perdidos se o pod for recriado. Para persistência real, associe `AmazonEBSCSIDriverPolicy` à role dos nodes ou migre o banco para RDS.

### Responsabilidades por ambiente

| Ambiente | Provisionamento | Exposição da API | Banco de dados |
| --- | --- | --- | --- |
| Local | Terraform + Kind | Service `NodePort` na porta `30000` | Deployment PostgreSQL |
| AWS Learning Lab | `eksctl` + manifests em `k8s/eks` | Service `LoadBalancer` | StatefulSet com `emptyDir` |

O Terraform em `src/infra/terraform` é responsável pelo ambiente local. Ele cria o cluster Kind, o namespace, o PostgreSQL, a API, os Secrets, o Service e o HPA. O EKS não é gerenciado por esse Terraform: o cluster AWS é criado pelo `eksctl`, e o script `scripts/deploy-eks.sh` publica a imagem no ECR e aplica os recursos Kubernetes.

### Limitação e decisão de armazenamento no Learning Lab

O manifesto EKS usa `emptyDir` no volume do PostgreSQL porque a role dos nodes do Learning Lab não autoriza operações como `ec2:DescribeAvailabilityZones`, necessárias ao provisioner `ebs.csi.aws.com`. Assim, o deploy não depende do EBS CSI e pode ser demonstrado com as permissões disponíveis.

Essa decisão tem impacto explícito: os dados são temporários e podem ser perdidos quando o StatefulSet ou o Pod for recriado. Para produção, substitua o PostgreSQL por Amazon RDS ou configure uma role adequada para o EBS CSI e utilize uma `StorageClass` persistente.

### Pré-requisitos

Instale também [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) e [eksctl](https://eksctl.io/installation/). Configure as credenciais temporárias fornecidas pelo laboratório e confirme a conta:

```bash
aws sts get-caller-identity
```

O laboratório precisa permitir EKS, EC2, VPC, ECR e ELB. A configuração descobre automaticamente as roles IAM preexistentes contendo `LabEksClusterRole` e `LabEksNodeRole`, conforme a permissão fornecida pelo Learning Lab. O cluster usa dois nós `t3.small`; ajuste [eksctl.yaml](../eksctl.yaml) se a cota da turma for menor.

No AWS CLI 2.36 ou superior, uma sessão interativa pode ser iniciada com:

```bash
aws login
aws sts get-caller-identity
```

Se o laboratório fornecer credenciais temporárias para exportação, configure as três no mesmo terminal (a sessão inclui o token):

```bash
export AWS_ACCESS_KEY_ID='chave-fornecida-pelo-laboratorio'
export AWS_SECRET_ACCESS_KEY='segredo-fornecido-pelo-laboratorio'
export AWS_SESSION_TOKEN='token-fornecido-pelo-laboratorio'
export AWS_REGION=us-east-1
aws sts get-caller-identity
```

Não use `aws configure` apenas com access key e secret key para esse caso: sem `AWS_SESSION_TOKEN`, credenciais temporárias do Learning Lab não serão aceitas.

### Criar cluster e publicar

Na raiz do repositório:

```bash
export AWS_REGION=us-east-1
export DB_PASSWORD='troque-esta-senha'
export JWT_SECRET='troque-este-segredo'
make eks-up
```

O script [deploy-eks.sh](../scripts/deploy-eks.sh) cria o cluster, o repositório ECR, a imagem de produção, os Secrets via `kubectl`, o PostgreSQL, executa `prisma migrate deploy` em um Job e aguarda o rollout da API.

Depois, obtenha o endereço público:

```bash
kubectl get service oficina-service -n oficina-mecanica
```

A API estará em `http://<hostname-do-load-balancer>/api` e o Swagger em `http://<hostname-do-load-balancer>/docs`.

### Publicar alterações

Com o cluster já criado, execute:

```bash
make eks-deploy
```

Para limpar recursos e evitar cobrança ao terminar o laboratório:

```bash
make eks-down
```

Como o banco está no cluster, apagar o cluster também apaga os dados do PostgreSQL. O repositório ECR pode ser removido separadamente com `aws ecr delete-repository --repository-name oficina-app --force --region "$AWS_REGION"`.



