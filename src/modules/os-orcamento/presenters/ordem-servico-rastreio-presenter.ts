import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'

export class OrdemServicoRastreioPresenter {
  static toHTTP(os: OrdemServico) {
    return {
      id: os.getId().toValue(),
      descricao: os.getDescricao(),
      status: os.getStatus(),
      criadoEm: os.getCriadoEm(),
      atualizadoEm: os.getAtualizadoEm() ?? undefined,
    }
  }
}