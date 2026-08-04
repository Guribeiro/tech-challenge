import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'

export class ServicoPresenter {
  static toHTTP(servico: Servico) {
    return {
      id: servico.getId().toValue(),
      nome: servico.getNome(),
      categoria: servico.getCategoria(),
      descricao: servico.getDescricao(),
      valorReferencia: servico.getValorReferencia(),
      criadoEm: servico.getCriadoEm() ?? null,
      atualizadoEm: servico.getAtualizadoEm() ?? null,
      desativadoEm: servico.getDesativadoEm() ?? null
    }
  }
}