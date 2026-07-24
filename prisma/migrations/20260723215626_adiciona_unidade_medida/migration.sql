/*
  Warnings:

  - The values [LT] on the enum `UnidadeMedida` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UnidadeMedida_new" AS ENUM ('UN', 'L', 'KG', 'JOGO', 'METRO');
ALTER TABLE "Produto" ALTER COLUMN "unidade_medida" TYPE "UnidadeMedida_new" USING ("unidade_medida"::text::"UnidadeMedida_new");
ALTER TYPE "UnidadeMedida" RENAME TO "UnidadeMedida_old";
ALTER TYPE "UnidadeMedida_new" RENAME TO "UnidadeMedida";
DROP TYPE "public"."UnidadeMedida_old";
COMMIT;
