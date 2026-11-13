-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO';

-- CreateTable
CREATE TABLE "ordem_servico_historico_status" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "ordem_servico_id" TEXT NOT NULL,
    "status_anterior" "StatusOS",
    "status_novo" "StatusOS" NOT NULL,
    "alterado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordem_servico_historico_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordem_servico_historico_status_ordem_servico_id_alterado_em_idx" ON "ordem_servico_historico_status"("ordem_servico_id", "alterado_em");

-- CreateIndex
CREATE INDEX "ordem_servico_historico_status_status_novo_alterado_em_idx" ON "ordem_servico_historico_status"("status_novo", "alterado_em");

-- CreateIndex
CREATE INDEX "clientes_status_idx" ON "clientes"("status");

-- CreateIndex
CREATE INDEX "veiculos_cliente_id_idx" ON "veiculos"("cliente_id");

-- CreateIndex
CREATE INDEX "ordem_servicos_status_prioridade_peso_idx" ON "ordem_servicos"("status", "prioridade_peso" DESC);

-- CreateIndex
CREATE INDEX "ordem_servicos_cliente_id_veiculo_id_idx" ON "ordem_servicos"("cliente_id", "veiculo_id");

-- CreateIndex
CREATE INDEX "ordem_servicos_mecanico_id_status_idx" ON "ordem_servicos"("mecanico_id", "status");

-- CreateIndex
CREATE INDEX "ordem_servicos_criado_em_idx" ON "ordem_servicos"("criado_em");

-- CreateIndex
CREATE INDEX "ordem_servico_servicos_ordem_servico_id_idx" ON "ordem_servico_servicos"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "ordem_servico_componentes_ordem_servico_id_idx" ON "ordem_servico_componentes"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "orcamentos_ordem_servico_id_idx" ON "orcamentos"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "orcamentos_cliente_id_idx" ON "orcamentos"("cliente_id");

-- CreateIndex
CREATE INDEX "orcamento_servicos_orcamento_id_idx" ON "orcamento_servicos"("orcamento_id");

-- CreateIndex
CREATE INDEX "orcamento_componentes_orcamento_id_idx" ON "orcamento_componentes"("orcamento_id");

-- CreateIndex
CREATE INDEX "faturas_orcamento_id_idx" ON "faturas"("orcamento_id");

-- CreateIndex
CREATE INDEX "faturas_status_idx" ON "faturas"("status");

-- CreateIndex
CREATE INDEX "termo_liberacoes_ordem_servico_id_idx" ON "termo_liberacoes"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "notificacoes_destinatario_id_lida_em_idx" ON "notificacoes"("destinatario_id", "lida_em");

-- AddForeignKey
ALTER TABLE "ordem_servico_historico_status" ADD CONSTRAINT "ordem_servico_historico_status_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Ajustes de dados (fase 3)
-- ---------------------------------------------------------------------------

-- Clientes excluídos logicamente passam a ter status INATIVO.
UPDATE "clientes" SET "status" = 'INATIVO' WHERE "deletado_em" IS NOT NULL;

-- "paga_em" era preenchido por @updatedAt em qualquer escrita (inclusive na emissão).
-- Somente faturas pagas devem possuir data de pagamento.
UPDATE "faturas" SET "paga_em" = NULL WHERE "status" <> 'PAGA';

-- ---------------------------------------------------------------------------
-- Histórico de status da OS mantido por trigger: garante o registro de toda
-- transição, independente de qual caso de uso/serviço realizou a escrita.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_historico_status_os() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "ordem_servico_historico_status" ("ordem_servico_id", "status_anterior", "status_novo", "alterado_em")
    VALUES (NEW."id", NULL, NEW."status", CURRENT_TIMESTAMP);
  ELSIF NEW."status" IS DISTINCT FROM OLD."status" THEN
    INSERT INTO "ordem_servico_historico_status" ("ordem_servico_id", "status_anterior", "status_novo", "alterado_em")
    VALUES (NEW."id", OLD."status", NEW."status", CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_ordem_servicos_historico_status"
AFTER INSERT OR UPDATE OF "status" ON "ordem_servicos"
FOR EACH ROW EXECUTE FUNCTION registrar_historico_status_os();

-- Carga inicial: registra o status atual das OS já existentes.
INSERT INTO "ordem_servico_historico_status" ("ordem_servico_id", "status_anterior", "status_novo", "alterado_em")
SELECT "id", NULL, "status", COALESCE("atualizado_em", "criado_em") FROM "ordem_servicos";
