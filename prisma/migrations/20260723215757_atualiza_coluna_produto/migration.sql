/*
  Warnings:

  - You are about to drop the column `deletado_em` on the `Produto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Produto" DROP COLUMN "deletado_em",
ADD COLUMN     "desativado_em" TIMESTAMP(3);
