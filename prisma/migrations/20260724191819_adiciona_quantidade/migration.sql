/*
  Warnings:

  - Added the required column `quantidade` to the `ordem_servico_componentes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordem_servico_componentes" ADD COLUMN     "quantidade" INTEGER NOT NULL;
