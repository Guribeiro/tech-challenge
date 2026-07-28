// src/modules/mecanica/application/use-cases/errors/email-ja-cadastrado-error.ts
import { UseCaseError } from "./use-case-error.js"

export class EmailJaCadastradoError extends Error implements UseCaseError {
  constructor() {
    super('Este e-mail já está cadastrado.')
  }
}