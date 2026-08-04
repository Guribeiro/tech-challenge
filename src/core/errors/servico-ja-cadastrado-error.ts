// src/modules/mecanica/application/use-cases/errors/email-ja-cadastrado-error.ts
import { UseCaseError } from "./use-case-error.js"

export class ServicoJaCadastradoError extends Error implements UseCaseError {
  constructor(nome: string) {
    super(`Já existe um serviço cadastrado com o nome "${nome}".`)
  }
}