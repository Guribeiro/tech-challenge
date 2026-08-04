// src/modules/mecanica/application/use-cases/errors/email-ja-cadastrado-error.ts
import { UseCaseError } from "./use-case-error.js"

export class ProdutoJaCadastradoError extends Error implements UseCaseError {
  constructor(nome: string) {
    super(`Já existe um produto cadastrado com o nome "${nome}".`)
  }
}