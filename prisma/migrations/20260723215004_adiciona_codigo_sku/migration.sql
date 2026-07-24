/*
  Warnings:

  - A unique constraint covering the columns `[codigo_sku]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nome` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigo_sku_key" ON "Produto"("codigo_sku");
