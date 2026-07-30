-- CreateTable
CREATE TABLE "recepcionistas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "desativado_em" TIMESTAMP(3),

    CONSTRAINT "recepcionistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recepcionistas_email_key" ON "recepcionistas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "recepcionistas_cpf_key" ON "recepcionistas"("cpf");
