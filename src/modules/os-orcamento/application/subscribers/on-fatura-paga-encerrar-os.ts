// src/modules/os-orcamento/application/subscribers/on-fatura-paga.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'
import { EncerrarOrdemServicoFaturaPagaUseCase } from '../use-cases/ordens-servicos/encerrar-os-fatura-paga.js'  // Seu caso de uso de encerramento
import { ClienteOrcamentoGateway } from '@/modules/os-orcamento/application/gateways/cliente-orcamento-gateway.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnFaturaPagaEncerrarOrdemServico implements EventHandler {
  private readonly logger = new Logger(OnFaturaPagaEncerrarOrdemServico.name)
  constructor(
    private readonly clienteOrcamentoGateway: ClienteOrcamentoGateway,
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
    const orcamentoId = fatura.getOrcamentoId().toValue()
    try {
      const dadosCliente = await this.clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId(orcamentoId)

      if (!dadosCliente) {
        throw new Error(`Dados do cliente não encontrados para o Orçamento #${orcamentoId}.`)
      }
      const { ordemServicoId } = dadosCliente

      await this.encerrarOrdemServicoFaturaPaga.execute({
        ordemServicoId
      })

      this.logger.log(`[OS-Core]: Ordem de Serviço #${ordemServicoId} foi ENCERRADA automaticamente após a confirmação do pagamento.`)
    } catch (error) {
      this.logger.error(
        `[Subscriber Error]: Falha ao encerrar a OS após o pagamento da fatura.`,
        error
      )
    }
  }
}