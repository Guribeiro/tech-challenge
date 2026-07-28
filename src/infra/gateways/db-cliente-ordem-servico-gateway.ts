import { ClienteOrdemServicoGateway, DadosClienteOSDTO } from "@/modules/liberacao/application/gateways/cliente-ordem-servico-gateway.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

@Injectable()
export class DbClienteOrdemServicoGateway implements ClienteOrdemServicoGateway {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) { }

  async obterDadosClientePorOrdemServicoId(ordemServicoId: string): Promise<DadosClienteOSDTO | null> {
    const os = await this.ordemServicoRepository.findById(ordemServicoId)
    if (!os) return null

    const cliente = await this.clienteRepository.findById(os.getClienteId().toValue())
    if (!cliente) return null

    return {
      ordemServicoId,
      clienteNome: cliente.getNome().getValor(),
      clienteTelefone: cliente.getTelefone().getValor(),
    }
  }
}