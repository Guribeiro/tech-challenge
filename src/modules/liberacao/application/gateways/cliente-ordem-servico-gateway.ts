// src/modules/liberacao/application/gateways/cliente-ordem-servico-gateway.ts
export interface DadosClienteOSDTO {
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  ordemServicoId: string
}

export abstract class ClienteOrdemServicoGateway {
  abstract obterDadosClientePorOrdemServicoId(ordemServicoId: string): Promise<DadosClienteOSDTO | null>
}