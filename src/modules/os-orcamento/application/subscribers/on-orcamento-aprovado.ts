import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoAprovadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-aprovado-event.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js'

export class OnClienteAprovouOrcamento implements EventHandler {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoAprovadoEvent.name
    )
  }

  private async executar(event: OrcamentoAprovadoEvent): Promise<void> {
    const { orcamento } = event
    const osId = orcamento.getOrdemServicoId().toValue()

    try {
      const ordemServico = await this.ordemServicoRepository.findById(osId)

      if (!ordemServico) {
        throw new Error(`Ordem de serviço associada ${osId} não foi encontrada.`)
      }

      ordemServico.autorizaExecucao()

      await this.ordemServicoRepository.save(ordemServico)

      console.log(`[Subscriber Success]: Status da OS ${osId} atualizado para EM_EXECUCAO devido à aprovação do orçamento.`)
    } catch (error) {
      console.error(`[Subscriber Error]: Falha ao atualizar OS ${osId} após aprovação do orçamento.`, error)
    }
  }
}