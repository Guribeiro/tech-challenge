import { Injectable, Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaEvent } from '../../../os-orcamento/domain/events/os-encerrada-event.js'
import { EmitirTermoLiberacaoUseCase } from '@/modules/liberacao/application/use-cases/emitir-termo-liberacao.js'

@Injectable()
export class OnOrdemServicoEncerrada implements EventHandler {
  private readonly logger = new Logger(OnOrdemServicoEncerrada.name)
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
      const result = await this.emitirTermoLiberacao.execute({
        ordemServicoId: ordemServico.getId().toValue()
      })

      if (result.isLeft()) {
        this.logger.warn(`Falha ao emitir termo de liberação para a OS #${ordemServico.getId().toValue()}. Erro: ${result.value.message}`)
        return
      }
      const termo = result.value.termo
      this.logger.log(`Termo de liberação emitido com sucesso para a OS #${ordemServico.getId().toValue()}. Termo ID: ${termo.getId().toValue()}`)
    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId().toValue()}`, error)
    }
  }
}