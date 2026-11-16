import { UseCaseError } from '@/core/errors/use-case-error.js'

export class VeiculoNaoPertenceAoClienteError extends Error implements UseCaseError {
  constructor() {
    super('O veículo informado não pertence ao cliente da ordem de serviço.')
    this.name = 'VeiculoNaoPertenceAoClienteError'
  }
}
