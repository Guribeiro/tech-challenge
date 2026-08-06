// test/repositories/in-memory-cliente-ordem-servico-gateway.ts
import {
  ClienteOrdemServicoGateway,
  DadosClienteOSDTO,
} from '@/modules/liberacao/application/gateways/cliente-ordem-servico-gateway.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'

export class InMemoryClienteOrdemServicoGateway implements ClienteOrdemServicoGateway {
  constructor(
    private readonly ordemServicoRepository: InMemoryOrdemServicoRepository,
    private readonly clienteRepository: InMemoryClienteRepository,
  ) { }

  async obterDadosClientePorOrdemServicoId(
    ordemServicoId: string,
  ): Promise<DadosClienteOSDTO | null> {
    // 1. Busca a Ordem de Serviço em memória
    const os = await this.ordemServicoRepository.findById(ordemServicoId)
    if (!os) return null

    // 2. Busca o Cliente associado à OS em memória
    const clienteId = os.getClienteId().toValue()
    const cliente = await this.clienteRepository.findById(clienteId)
    if (!cliente) return null

    // 3. Retorna o DTO esperado pelo domínio de Liberação
    return {
      clienteId,
      ordemServicoId,
      clienteNome: cliente.getNome().getValor(),
      clienteTelefone: cliente.getTelefone().getValor(),
    }
  }
}