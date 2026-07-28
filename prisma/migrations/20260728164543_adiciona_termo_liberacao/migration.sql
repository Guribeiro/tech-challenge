-- CreateEnum
CREATE TYPE "MotivoTermoLiberacao" AS ENUM ('PAGAMENTO_APROVADO', 'REJEICAO_ORCAMENTO');

-- CreateTable
CREATE TABLE "TermoLiberacao" (
    "id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "placaVeiculo" TEXT NOT NULL,
    "motivo" "MotivoTermoLiberacao" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "emitido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermoLiberacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TermoLiberacao" ADD CONSTRAINT "TermoLiberacao_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
