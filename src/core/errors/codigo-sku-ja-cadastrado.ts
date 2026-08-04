import { UseCaseError } from '@/core/errors/use-case-error.js'

export class CodigoSKUJaCadastradoError extends Error implements UseCaseError {
  constructor() {
    super('Esta Código SKU já está cadastrado')
  }
}