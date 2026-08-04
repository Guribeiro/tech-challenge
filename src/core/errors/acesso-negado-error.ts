import { UseCaseError } from '@/core/errors/use-case-error.js'

export class AcessoNegadoError extends Error implements UseCaseError {
  constructor(message = 'Você não tem permissão para realizar esta ação.') {
    super(message)
    this.name = 'AcessoNegadoError'
  }
}