// src/modules/faturamento/application/gateways/orcamento-gateway.ts
export interface OrcamentoAprovadoDTO {
  orcamentoId: string
  valorTotal: number
}
export abstract class OrcamentoGateway {
  abstract obterValorAprovadoPorOrdemServicoId(ordemServicoId: string): Promise<OrcamentoAprovadoDTO>
}