// src/infra/gateways/db-orcamento-gateway.ts
import { OrcamentoAprovadoDTO, OrcamentoGateway } from "@/modules/faturamento/application/gateways/orcamento-gateway.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { Injectable } from "@nestjs/common"

@Injectable()
export class DbOrcamentoGateway implements OrcamentoGateway {
  constructor(private readonly orcamentoRepository: OrcamentoRepository) { }

  async obterValorAprovadoPorOrdemServicoId(ordemServicoId: string): Promise<OrcamentoAprovadoDTO> {
    const orcamento = await this.orcamentoRepository.findByOrdemServicoId(ordemServicoId)

    if (!orcamento) {
      throw new Error(`Nenhum orçamento encontrado para a OS ${ordemServicoId}`)
    }

    return {
      orcamentoId: orcamento.getId().toValue(),
      valorTotal: orcamento.getValorTotalGeral(),
    }
  }
}