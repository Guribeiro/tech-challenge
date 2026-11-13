import { UseCaseError } from '@/core/errors/use-case-error.js'

export class ClienteInativoError extends Error implements UseCaseError {
  constructor() {
    super('O cliente está inativo ou bloqueado e não pode realizar esta operação.')
    this.name = 'ClienteInativoError'
  }
}
