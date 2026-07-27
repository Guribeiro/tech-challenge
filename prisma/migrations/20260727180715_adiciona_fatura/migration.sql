-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA');

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "orcamento_id" TEXT NOT NULL,
    "status" "StatusFatura" NOT NULL,
    "valor_total" INTEGER NOT NULL,
    "emitida_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paga_em" TIMESTAMP(3),

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
