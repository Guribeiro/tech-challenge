// src/modules/faturamento/application/gateways/orcamento-gateway.ts
export interface OrcamentoGateway {
  obterValorAprovadoPorOrdemServicoId(ordemServicoId: string): Promise<number>
}