// src/modules/mecanica/application/use-cases/errors/cpf-ja-cadastrado-error.ts
import { UseCaseError } from '@/core/errors/use-case-error.js'

export class CpfJaCadastradoError extends Error implements UseCaseError {
  constructor() {
    super('Este CPF já está cadastrado.')
  }
}