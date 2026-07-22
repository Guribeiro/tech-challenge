// src/modules/os-orcamento/application/subscribers/on-fatura-paga.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'
import { EncerrarOrdemServicoFaturaPagaUseCase } from '../use-cases/ordens-servicos/encerrar-os-fatura-paga.js'  // Seu caso de uso de encerramento

export class OnFaturaPagaEncerrarOrdemServico implements EventHandler {
  constructor(
    private readonly encerrarOrdemServicoFaturaPaga: EncerrarOrdemServicoFaturaPagaUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      FaturaPagaEvent.name
    )
  }

  private async executar({ fatura }: FaturaPagaEvent): Promise<void> {
    const osId = fatura.getOrdemServicoId().toValue()

    try {

      await this.encerrarOrdemServicoFaturaPaga.execute({
        ordemServicoId: osId
      })

      console.log(`[OS-Core]: Ordem de Serviço #${osId} foi ENCERRADA automaticamente após a confirmação do pagamento.`)
    } catch (error) {
      console.error(
        `[Subscriber Error]: Falha ao encerrar a OS #${osId} após o pagamento da fatura.`,
        error
      )
    }
  }
}