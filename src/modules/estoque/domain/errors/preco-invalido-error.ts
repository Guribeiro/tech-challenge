import { DomainError } from '@/core/errors/domain-errors/domain-error.js'

export class PrecoInvalidoError extends DomainError {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'PrecoInvalidoError'
  }
}