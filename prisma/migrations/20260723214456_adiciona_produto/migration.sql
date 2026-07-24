-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('INSUMO', 'PECA');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('LT', 'L', 'KG', 'JOGO', 'METRO');

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "marca" TEXT,
    "descricao" TEXT,
    "codigo_sku" TEXT,
    "codigo_fabricante" TEXT,
    "preco_unitario" INTEGER NOT NULL,
    "preco_custo" INTEGER NOT NULL,
    "quantidade_estoque" INTEGER NOT NULL,
    "estoque_minimo" INTEGER,
    "estoque_maximo" INTEGER,
    "unidade_medida" "UnidadeMedida",
    "localizacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);
