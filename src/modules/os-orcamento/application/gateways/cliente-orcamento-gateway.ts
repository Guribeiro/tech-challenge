// src/modules/faturamento/application/gateways/cliente-orcamento-gateway.ts
export interface DadosNotificacaoClienteDTO {
  clienteId: string
  nome: string
  telefone: string
  ordemServicoId: string // Opcional: útil para montar a mensagem do tipo "OS #123"
}

export abstract class ClienteOrcamentoGateway {
  abstract obterDadosNotificacaoPorOrcamentoId(orcamentoId: string): Promise<DadosNotificacaoClienteDTO | null>
}