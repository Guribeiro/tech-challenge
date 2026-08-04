import { UseCaseError } from '@/core/errors/use-case-error.js'

export class RecursoNaoEncontradoError extends Error implements UseCaseError {
  constructor(recurso = 'Recurso') {
    super(`${recurso} não encontrado(a).`)
  }
}