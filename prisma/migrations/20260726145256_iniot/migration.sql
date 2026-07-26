-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MECANICO', 'RECEPCAO', 'ADMIN', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('INSUMO', 'PECA');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('UN', 'L', 'KG', 'JOGO', 'METRO');

-- CreateEnum
CREATE TYPE "ServicoCategoria" AS ENUM ('SEGURANCA', 'MANUTENCAO_PREVENTIVA', 'ESTETICA', 'ELETRICA', 'MECANICA_GERAL');

-- CreateEnum
CREATE TYPE "TipoPrioridade" AS ENUM ('URGENTE', 'ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'EM_EXECUCAO', 'AUTORIZADA', 'PRONTA_PARA_INICIAR', 'FINALIZADA', 'ENTREGUE', 'ENCERRADA_REJEICAO', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "ClienteTipo" AS ENUM ('PJ', 'PF');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "role" "Role" NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "tipo" "ClienteTipo" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mecanicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "especialidade" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "desativado_em" TIMESTAMP(3),

    CONSTRAINT "mecanicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cor" TEXT,
    "quilometragem" INTEGER,
    "combustivel" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),
    "cliente_id" TEXT NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "marca" TEXT,
    "descricao" TEXT,
    "codigo_sku" TEXT,
    "codigo_fabricante" TEXT,
    "preco_unitario" INTEGER NOT NULL,
    "preco_custo" INTEGER NOT NULL,
    "quantidade_estoque" INTEGER NOT NULL,
    "quantidade_reservada" INTEGER,
    "estoque_minimo" INTEGER,
    "estoque_maximo" INTEGER,
    "unidade_medida" "UnidadeMedida",
    "localizacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "desativado_em" TIMESTAMP(3),

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "categoria" "ServicoCategoria" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorReferencia" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "desativado_em" TIMESTAMP(3),

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servicos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "veiculo_id" TEXT NOT NULL,
    "mecanico_id" TEXT,
    "descricao" TEXT NOT NULL,
    "prioridade" "TipoPrioridade" NOT NULL DEFAULT 'BAIXA',
    "prioridade_peso" INTEGER NOT NULL DEFAULT 1,
    "e_garantia" BOOLEAN NOT NULL,
    "status" "StatusOS" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "ordem_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico_servicos" (
    "id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "ServicoCategoria" NOT NULL,
    "preco_unitario" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordem_servico_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico_componentes" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
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

    CONSTRAINT "ordem_servico_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "mecanicos_email_key" ON "mecanicos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mecanicos_cpf_key" ON "mecanicos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_sku_key" ON "produtos"("codigo_sku");

-- CreateIndex
CREATE UNIQUE INDEX "ordem_servico_componentes_codigo_sku_key" ON "ordem_servico_componentes"("codigo_sku");

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servicos" ADD CONSTRAINT "ordem_servicos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servicos" ADD CONSTRAINT "ordem_servicos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servicos" ADD CONSTRAINT "ordem_servicos_mecanico_id_fkey" FOREIGN KEY ("mecanico_id") REFERENCES "mecanicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_servicos" ADD CONSTRAINT "ordem_servico_servicos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_servicos" ADD CONSTRAINT "ordem_servico_servicos_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_componentes" ADD CONSTRAINT "ordem_servico_componentes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_componentes" ADD CONSTRAINT "ordem_servico_componentes_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordem_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
