import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EmitirTermoRejeicaoUseCase } from '@/modules/liberacao/application/use-cases/emitir-termo-liberacao-rejeicao.js'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OnOrdemServicoEncerradaPorRejeicao implements EventHandler {
  constructor(
    private readonly emitirTermoRejeicao: EmitirTermoRejeicaoUseCase,
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
      await this.emitirTermoRejeicao.execute({
        ordemServicoId: ordemServico.getId().toValue()
      })
    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId().toValue()}`, error)
    }
  }
}