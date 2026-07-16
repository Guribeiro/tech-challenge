import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao.js'
import { EmitirTermoLiberacaoUseCase } from '@/modules/liberacao/application/use-cases/emitir-termo-liberacao.js'

export class OnOrdemServicoEncerrada implements EventHandler {
  constructor(
    private readonly emitirTermoLiberacao: EmitirTermoLiberacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSEncerradaPorRejeicaoEvent.name
    )
  }

  private async executar(event: OSEncerradaPorRejeicaoEvent): Promise<void> {
    const { ordemServico } = event

    try {
      await this.emitirTermoLiberacao.execute({
        ordemServicoId: ordemServico.getId()
      })
    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId()}`, error)
    }
  }
}