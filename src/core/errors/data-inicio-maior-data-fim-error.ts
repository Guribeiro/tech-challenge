import { UseCaseError } from '@/core/errors/use-case-error.js'

export class DataInicioMaiorQueDataFimError extends Error implements UseCaseError {
  constructor(message = 'Data de início não pode ser maior que data de fim.') {
    super(message)
    this.name = 'DataInicioMaiorQueDataFimError'
  }
}