-- CreateEnum
CREATE TYPE "ServicoCategoria" AS ENUM ('SEGURANCA', 'MANUTENCAO_PREVENTIVA', 'ESTETICA', 'ELETRICA', 'MECANICA_GERAL');

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "categoria" "ServicoCategoria" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorReferencia" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "desativado_em" TIMESTAMP(3),

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);
