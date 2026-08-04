-- CreateEnum
CREATE TYPE "StatusOrcamento" AS ENUM ('CRIADO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'RENEGOCIADO', 'REJEITADO_DEFINITIVO');

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "desconto_porcentagem" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusOrcamento" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_servicos" (
    "id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "orcamento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "ServicoCategoria" NOT NULL,
    "preco_unitario" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamento_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_componentes" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "orcamento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "marca" TEXT,
    "codigo_sku" TEXT,
    "codigo_fabricante" TEXT,
    "descricao" TEXT,
    "preco_custo" INTEGER NOT NULL,
    "preco_unitario" INTEGER NOT NULL,
    "unidade_medida" "UnidadeMedida",
    "quantidade" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamento_componentes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_servicos" ADD CONSTRAINT "orcamento_servicos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_servicos" ADD CONSTRAINT "orcamento_servicos_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_componentes" ADD CONSTRAINT "orcamento_componentes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_componentes" ADD CONSTRAINT "orcamento_componentes_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
