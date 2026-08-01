# 🛠️ FIAP Tech Challenge - Oficina Mecânica

> Backend modular para gestão de ordens de serviço em oficina mecânica, cobrindo diagnóstico, orçamento, estoque, faturamento, liberação e acompanhamento de status.

---

## 📌 Sumário
- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura e Estrutura de Pastas](#-arquitetura-e-estrutura-de-pastas)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Como Executar o Projeto](#-como-executar-o-projeto)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)
- [Rodando os Testes](#-rodando-os-testes)
- [Licença](#-licença)

---

## 📖 Sobre o Projeto
Este projeto implementa uma API backend robusta para o domínio de uma oficina mecânica, com foco em processos operacionais críticos como criação de ordens de serviço, diagnóstico técnico, geração automática de orçamento, aprovação ou recusa do cliente, reserva de peças em estoque, execução do serviço, faturamento e liberação do veículo para entrega.

A solução foi estruturada com uma abordagem modular e orientada a domínios, permitindo crescimento incremental sem acoplar demais regras de negócio à infraestrutura. O sistema também incorpora autenticação JWT para rotas administrativas e expõe uma documentação interativa via Swagger.

---

## 🚀 Tecnologias Utilizadas

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger&logoColor=black)
![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

### Categorias
- **Linguagem & Runtime:** Node.js, TypeScript
- **Framework & Core:** NestJS, Express, Passport JWT
- **Banco de Dados & ORM:** PostgreSQL, Prisma ORM, Prisma Driver Adapter para PostgreSQL
- **Documentação:** Swagger / OpenAPI
- **Testes & Qualidade:** Vitest, Supertest, ESLint

---

## 🏗️ Arquitetura e Estrutura de Pastas
A aplicação segue um padrão arquitetural modular com forte separação entre módulos de negócio, casos de uso, controladores e infraestrutura. A organização é inspirada em princípios de Clean Architecture e DDD, com cada contexto encapsulando suas regras e integrações.

### Estrutura representativa
```text
src/
├── modules/                 # Módulos de domínio da aplicação
│   ├── autenticacao/        # Login e autenticação JWT
│   ├── os-orcamento/       # Clientes, veículos, serviços, ordens de serviço e orçamentos
│   ├── estoque/            # Produtos, estoque e reservas
│   ├── faturamento/        # Faturamento e webhook de pagamento
│   ├── liberacao/          # Fluxo de liberação e entrega
│   └── notificacoes/       # Integração de notificações
├── infra/                  # Camada de infraestrutura
│   ├── http/               # DTOs, filtros e entradas HTTP
│   ├── nest/               # Módulo raiz da aplicação NestJS
│   ├── auth/               # Estratégias e guardas de autenticação
│   ├── database/           # Configuração de banco e conexão
│   └── main.ts             # Bootstrap da aplicação
├── generated/              # Cliente Prisma gerado automaticamente
└── shared/                 # Regras e utilidades compartilhadas
```

### Padrão de organização
- **Modules:** representam os bounded contexts do negócio.
- **Controllers:** expõem os endpoints HTTP.
- **DTOs:** definem contratos de entrada e saída da API.
- **Infra:** concentra a integração com NestJS, Prisma, autenticação e documentação.
- **Prisma Schema:** define o modelo relacional e as relações entre clientes, veículos, serviços, produtos, ordens de serviço e faturamento.

---

## ✨ Funcionalidades Principais
- Criação e acompanhamento de ordens de serviço.
- Cadastro de clientes, veículos, serviços, mecânicos e recepcionistas.
- Geração automática de orçamento após o diagnóstico técnico.
- Aprovação, recusa e renegociação de orçamento.
- Reserva e controle de estoque de peças e insumos.
- Finalização de execução da OS e dedução automática de estoque.
- Emissão de fatura e webhook de confirmação de pagamento.
- Geração de termo de liberação e fluxo de entrega do veículo.
- Métricas de tempo médio de execução de ordens de serviço.
- Autenticação JWT para áreas administrativas.

---

## ▶️ Como Executar o Projeto
### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- npm ou pnpm

### 1) Instale as dependências
```bash
npm install
```

### 2) Suba o banco PostgreSQL
```bash
docker compose up -d postgres postgres-test
```

### 3) Aplique as migrations e seed inicial
```bash
npx prisma migrate deploy
npm run db:seed
```

### 4) Inicie a aplicação em modo desenvolvimento
```bash
npm run start:dev
```

A API ficará disponível em:
- API base: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

---

## 📚 Documentação da API (Swagger)
A documentação interativa da API está disponível no endpoint Swagger em:

```text
http://localhost:3000/docs
```

A aplicação também utiliza o prefixo global `/api` para todos os endpoints, e a documentação cobre os módulos de autenticação, ordens de serviço, estoque, faturamento, liberação e notificações.

---

## 🧪 Rodando os Testes
O projeto conta com testes unitários, testes e2e e relatórios de cobertura.

### Testes unitários
```bash
npm test
```

### Cobertura
```bash
npm run test:cov
```

### Testes e2e
```bash
npm run test:e2e
```

### UI de cobertura
```bash
npm run test:all:ui
```

---

## 📄 Licença
Este projeto está licenciado sob a licença ISC, conforme informado no arquivo de configuração do pacote.
