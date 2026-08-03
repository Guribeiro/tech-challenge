import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRenegociadoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-recusado-event.js'
import { EncerrarOrdemServicoUseCase } from '../use-cases/ordens-servicos/encerrar-os-por-rejeicao.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRenegociadoRecusadoEncerrarOS implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoRenegociadoRecusadoEncerrarOS.name)
  constructor(
    private readonly encerrarOrdemServico: EncerrarOrdemServicoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoRenegociadoRecusadoEvent.name
    )
  }

  private async executar(event: OrcamentoRenegociadoRecusadoEvent): Promise<void> {
    const { orcamento } = event
    try {
      await this.encerrarOrdemServico.execute({
        ordemServicoId: orcamento.getOrdemServicoId().toValue()
      })
      this.logger.log(`[Subscriber Success]: OS ${orcamento.getOrdemServicoId().toValue()} encerrada devido à recusa do orçamento renegociado.`)
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Falha ao encerrar OS ${orcamento.getOrdemServicoId().toValue()}`, error)
    }
  }
}