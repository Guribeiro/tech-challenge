import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaEvent } from '../../../os-orcamento/domain/events/os-encerrada-event.js'
import { EmitirTermoLiberacaoUseCase } from '@/modules/liberacao/application/use-cases/emitir-termo-liberacao.js'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OnOrdemServicoEncerrada implements EventHandler {
  constructor(
    private readonly emitirTermoLiberacao: EmitirTermoLiberacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSEncerradaEvent.name
    )
  }

  private async executar(event: OSEncerradaEvent): Promise<void> {
    const { ordemServico } = event

    try {
      await this.emitirTermoLiberacao.execute({
        ordemServicoId: ordemServico.getId().toValue()
      })
    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId().toValue()}`, error)
    }
  }
}