// src/infra/gateways/db-orcamento-gateway.ts
import { OrcamentoGateway } from "@/modules/faturamento/application/gateways/orcamento-gateway.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"

export class DbOrcamentoGateway implements OrcamentoGateway {
  constructor(private readonly orcamentoRepository: OrcamentoRepository) { }

  async obterValorAprovadoPorOrdemServicoId(ordemServicoId: string): Promise<number> {
    const orcamento = await this.orcamentoRepository.findByOrdemServicoId(ordemServicoId)

    if (!orcamento) {
      throw new Error(`Nenhum orçamento encontrado para a OS ${ordemServicoId}`)
    }

    return orcamento.getValorTotalGeral()
  }
}