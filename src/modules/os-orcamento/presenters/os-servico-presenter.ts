import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/ordem-servico-servico.js'

export class OsServicoPresenter {
  static toHTTP(servico: OrdemServicoServico) {
    return {
      id: servico.getId().toValue(),
      nome: servico.getNome(),
      categoria: servico.getCategoria(),
      descricao: servico.getDescricao(),
      precoUnitario: servico.getPrecoUnitario(),
      criadoEm: servico.getCriadoEm() ?? null,
    }
  }
}