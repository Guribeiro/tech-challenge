import { DomainError } from '@/core/errors/domain-errors/domain-error.js'

export class SaldoInsuficienteError extends DomainError {
  constructor(nomeProduto: string, disponivel: number, solicitado: number) {
    super(
      `Saldo disponível insuficiente do produto "${nomeProduto}" para reserva. Disponível: ${disponivel}, Solicitado: ${solicitado}`
    )
    this.name = 'SaldoInsuficienteError'
  }
}