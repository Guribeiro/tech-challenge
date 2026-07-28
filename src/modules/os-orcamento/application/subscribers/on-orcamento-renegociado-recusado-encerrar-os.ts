import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRenegociadoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-recusado-event.js'
import { EncerrarOrdemServicoUseCase } from '../use-cases/ordens-servicos/encerrar-os-por-rejeicao.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRenegociadoRecusadoEncerrarOS implements EventHandler, OnModuleInit {
  constructor(
    private readonly encerrarOrdemServico: EncerrarOrdemServicoUseCase
  ) { }

  onModuleInit(): void {
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

    } catch (error) {
      console.error(`[ERRO] - Falha ao encerrar OS ${orcamento.getOrdemServicoId().toValue()}`, error)
    }
  }
}