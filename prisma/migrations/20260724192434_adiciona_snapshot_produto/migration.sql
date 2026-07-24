/*
  Warnings:

  - You are about to drop the column `categoria` on the `ordem_servico_componentes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo_sku]` on the table `ordem_servico_componentes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `preco_custo` to the `ordem_servico_componentes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `ordem_servico_componentes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordem_servico_componentes" DROP COLUMN "categoria",
ADD COLUMN     "codigo_fabricante" TEXT,
ADD COLUMN     "codigo_sku" TEXT,
ADD COLUMN     "marca" TEXT,
ADD COLUMN     "preco_custo" INTEGER NOT NULL,
ADD COLUMN     "tipo" "TipoProduto" NOT NULL,
ADD COLUMN     "unidade_medida" "UnidadeMedida";

-- CreateIndex
CREATE UNIQUE INDEX "ordem_servico_componentes_codigo_sku_key" ON "ordem_servico_componentes"("codigo_sku");
