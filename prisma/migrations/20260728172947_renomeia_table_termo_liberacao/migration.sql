/*
  Warnings:

  - You are about to drop the `TermoLiberacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TermoLiberacao" DROP CONSTRAINT "TermoLiberacao_ordem_servico_id_fkey";

-- DropTable
DROP TABLE "TermoLiberacao";

-- CreateTable
CREATE TABLE "termo_liberacoes" (
    "id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "placaVeiculo" TEXT NOT NULL,
    "motivo" "MotivoTermoLiberacao" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "emitido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "termo_liberacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "termo_liberacoes" ADD CONSTRAINT "termo_liberacoes_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
