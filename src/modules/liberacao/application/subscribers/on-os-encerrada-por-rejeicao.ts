import { Injectable, Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EmitirTermoRejeicaoUseCase } from '@/modules/liberacao/application/use-cases/emitir-termo-liberacao-rejeicao.js'

@Injectable()
export class OnOrdemServicoEncerradaPorRejeicao implements EventHandler {
  private readonly logger = new Logger(OnOrdemServicoEncerradaPorRejeicao.name)
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
      const result = await this.emitirTermoRejeicao.execute({
        ordemServicoId: ordemServico.getId().toValue()
      })

      if (result.isLeft()) {
        this.logger.warn(`Falha ao emitir termo de liberação por rejeição para a OS #${ordemServico.getId().toValue()}. Erro: ${result.value.message}`)
        return
      }
      const termo = result.value.termo
      this.logger.log(`Termo de liberação por rejeição emitido com sucesso para a OS #${ordemServico.getId().toValue()}. Termo ID: ${termo.getId().toValue()}`)
    } catch (error) {
      this.logger.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId().toValue()}`, error)
    }
  }
}