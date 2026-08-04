// src/modules/faturamento/presenters/fatura-presenter.ts
import { Fatura } from '../domain/entities/fatura.js'

export class FaturaPresenter {
  static toHTTP(fatura: Fatura) {
    return {
      id: fatura.getId().toValue(),
      orcamentoId: fatura.getOrcamentoId().toValue(),
      valorTotal: fatura.getValorTotal(),
      status: fatura.getStatus(),
      emitidaEm: fatura.getEmitidaEm(),
      pagaEm: fatura.getPagaEm() ?? null,
    }
  }
}