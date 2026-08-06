// test/repositories/in-memory-cliente-orcamento-gateway.ts
import {
  ClienteOrcamentoGateway,
  DadosNotificacaoClienteDTO,
} from '@/modules/faturamento/application/gateways/cliente-orcamento-gateway.js'
import { InMemoryOrcamentoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-orcamento-repository.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'

export class InMemoryClienteOrcamentoGateway implements ClienteOrcamentoGateway {
  constructor(
    private readonly orcamentoRepository: InMemoryOrcamentoRepository,
    private readonly ordemServicoRepository: InMemoryOrdemServicoRepository,
    private readonly clienteRepository: InMemoryClienteRepository,
  ) { }

  async obterDadosNotificacaoPorOrcamentoId(
    orcamentoId: string,
  ): Promise<DadosNotificacaoClienteDTO | null> {
    // 1. Busca o Orçamento in-memory
    const orcamento = await this.orcamentoRepository.findById(orcamentoId)
    if (!orcamento) return null

    const osId = orcamento.getOrdemServicoId().toValue()

    // 2. Busca a Ordem de Serviço in-memory
    const ordemServico = await this.ordemServicoRepository.findById(osId)
    if (!ordemServico) return null

    // 3. Busca o Cliente in-memory
    const clienteId = ordemServico.getClienteId().toValue()
    const cliente = await this.clienteRepository.findById(clienteId)
    if (!cliente) return null

    return {
      clienteId: cliente.getId().toValue(),
      nome: cliente.getNome().getValor(),
      telefone: cliente.getTelefone().getValor(),
      ordemServicoId: osId,
    }
  }
}