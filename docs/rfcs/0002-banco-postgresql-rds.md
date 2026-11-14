# RFC 0002 — Banco de dados: PostgreSQL no Amazon RDS

- **Status:** aceita
- **Data:** 2026-11-13

## Contexto

Na fase 2 o PostgreSQL rodava dentro do cluster com armazenamento efêmero (`emptyDir`), porque
a role dos nodes do Learner Lab não permite o EBS CSI criar volumes. Isso perde dados a cada
recriação do pod e não serve para produção. A fase 3 exige um banco gerenciado, com
justificativa e modelo de dados documentados ([modelo-dados.md](../modelo-dados.md)).

O domínio é transacional e relacional (OS, itens, orçamentos versionados, faturas, estoque
reservado), já modelado com Prisma e PostgreSQL desde a fase 1.

## Opções avaliadas

| Critério | RDS PostgreSQL | Aurora PostgreSQL (Serverless v2) | DynamoDB | PostgreSQL no EKS com EBS |
| --- | --- | --- | --- | --- |
| Modelo | Relacional, ACID | Relacional, ACID | Chave-valor/documento | Relacional, ACID |
| Mudança no código | Nenhuma (Prisma) | Nenhuma | Reescrita da persistência e das consultas | Nenhuma |
| Joins, FKs, consultas analíticas | Sim | Sim | Não (modelagem por padrão de acesso) | Sim |
| Custo no laboratório | Baixo (`db.t3.micro`) | Mais alto (mínimo de ACUs) | Baixo | Baixo, mas exige permissões IAM indisponíveis |
| Operação | Gerenciada (backup, patch, TLS) | Gerenciada | Gerenciada | Manual |

## Decisão

**Amazon RDS for PostgreSQL 16**, `db.t3.micro`, em subnets privadas, **uma instância por
ambiente** (`oficina-db-hml`, `oficina-db-prd`), provisionado pelo repositório
`oficina-infra-db`:

- acesso apenas dos nodes do EKS e das Lambdas de autenticação (security groups);
- TLS obrigatório (`rds.force_ssl = 1`), armazenamento criptografado (gp3);
- backup automático, log de queries lentas e de lock waits exportado ao CloudWatch;
- credenciais geradas pelo Terraform e publicadas no Secrets Manager (`oficina/<env>/db`),
  lidas pela pipeline de deploy da API e pela Lambda.

Uma instância por ambiente, em vez de dois bancos numa instância, porque criar bancos e
usuários adicionais exigiria um provider PostgreSQL conectado ao RDS privado, inalcançável
pelos runners do GitHub; instâncias separadas também dão isolamento real entre hml e prd.

## Consequências

- **Positivas:** dados persistentes e isolados por ambiente; nenhuma mudança no código da API;
  a Lambda consulta o mesmo banco diretamente.
- **Negativas e mitigação:**
  - Single-AZ, sem `deletion_protection` e sem snapshot final, para caber no orçamento e
    permitir destruir o ambiente entre sessões. Em produção real: Multi-AZ, proteção contra
    exclusão, snapshot final e réplicas de leitura se necessário.
  - Duas instâncias custam o dobro de uma; aceitável no tamanho `db.t3.micro`.
  - A Lambda dentro da VPC adiciona latência de cold start; mitigada com cache dos segredos e
    do pool de conexões entre invocações.
