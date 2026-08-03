import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoAprovadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-aprovado-event.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnClienteAprovouOrcamento implements EventHandler {
  private readonly logger = new Logger(OnClienteAprovouOrcamento.name)
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
        this.logger.error(`[Subscriber Error]: Ordem de serviço associada ${osId} não foi encontrada.`)
        return
      }

      ordemServico.autorizaExecucao()

      await this.ordemServicoRepository.save(ordemServico)

      this.logger.log(`[Subscriber Success]: Status da OS ${osId} atualizado para EM_EXECUCAO devido à aprovação do orçamento.`)
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Falha ao atualizar OS ${osId} após aprovação do orçamento.`, error)
    }
  }
}