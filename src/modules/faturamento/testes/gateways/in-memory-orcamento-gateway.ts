import {
  OrcamentoAprovadoDTO,
  OrcamentoGateway,
} from '@/modules/faturamento/application/gateways/orcamento-gateway.js'
import { OrcamentoRepository } from '@/modules/os-orcamento/domain/repositories/orcamento-repository.js'

export interface InMemoryOrcamentoItem extends OrcamentoAprovadoDTO {
  ordemServicoId: string
}

export class InMemoryOrcamentoGateway implements OrcamentoGateway {
  constructor(private readonly orcamentoRepository: OrcamentoRepository) { }

  async obterValorAprovadoPorOrdemServicoId(
    ordemServicoId: string,
  ): Promise<OrcamentoAprovadoDTO> {
    const item = await this.orcamentoRepository.findByOrdemServicoId(ordemServicoId)

    if (!item) {
      throw new Error(`Nenhum orçamento encontrado para a OS ${ordemServicoId}`)
    }

    return {
      orcamentoId: item.getId().toValue(),
      valorTotal: item.getValorTotalGeral(),
    }
  }
}