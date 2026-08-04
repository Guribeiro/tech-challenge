import { UseCaseError } from '@/core/errors/use-case-error.js'

export class EstoqueInsuficienteError extends Error implements UseCaseError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Estoque insuficiente para o produto "${identifier}".`
      : 'Estoque insuficiente para realizar esta operação.'
    super(message)
    this.name = 'EstoqueInsuficienteError'
  }
}