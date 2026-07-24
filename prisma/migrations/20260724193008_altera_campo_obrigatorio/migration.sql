/*
  Warnings:

  - Made the column `unidade_medida` on table `ordem_servico_componentes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ordem_servico_componentes" ALTER COLUMN "unidade_medida" SET NOT NULL;
