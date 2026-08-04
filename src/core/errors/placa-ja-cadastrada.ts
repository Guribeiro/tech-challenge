import { UseCaseError } from '@/core/errors/use-case-error.js'

export class PlacaJaCadastradaError extends Error implements UseCaseError {
  constructor() {
    super('Esta Placa já está cadastrada')
  }
}