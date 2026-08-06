// src/infra/gateways/db-cliente-orcamento-gateway.ts
import { Injectable } from '@nestjs/common'
import { ClienteOrcamentoGateway, DadosNotificacaoClienteDTO } from '@/modules/faturamento/application/gateways/cliente-orcamento-gateway.js'
import { OrcamentoRepository } from '@/modules/os-orcamento/domain/repositories/orcamento-repository.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'

@Injectable()
export class DbClienteOrcamentoGateway implements ClienteOrcamentoGateway {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) { }

  async obterDadosNotificacaoPorOrcamentoId(orcamentoId: string): Promise<DadosNotificacaoClienteDTO | null> {
    // 1. Busca o Orçamento para pegar o ID da OS associada
    const orcamento = await this.orcamentoRepository.findById(orcamentoId)
    if (!orcamento) return null

    const osId = orcamento.getOrdemServicoId().toValue()

    // 2. Busca a OS para obter o ID do Cliente
    const ordemServico = await this.ordemServicoRepository.findById(osId)
    if (!ordemServico) return null

    // 3. Busca o Cliente para extrair nome e telefone
    const cliente = await this.clienteRepository.findById(ordemServico.getClienteId().toValue())
    if (!cliente) return null

    return {
      clienteId: cliente.getId().toValue(),
      nome: cliente.getNome().getValor(),
      telefone: cliente.getTelefone().getValor(),
      ordemServicoId: osId,
    }
  }
}