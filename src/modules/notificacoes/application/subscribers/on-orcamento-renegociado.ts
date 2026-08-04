import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRenegociadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { Injectable, Logger } from '@nestjs/common'
import { ClienteOrcamentoGateway } from '../gateways/cliente-orcamento-gateway.js'

@Injectable()
export class OnOrcamentoRenegociado implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoRenegociado.name)
  constructor(
    private readonly clienteOrcamentoGateway: ClienteOrcamentoGateway,
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoRenegociadoEvent.name
    )
  }

  private async executar({ orcamento }: OrcamentoRenegociadoEvent): Promise<void> {
    const orcamentoId = orcamento.getId().toValue()

    try {
      const dadosCliente = await this.clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId(orcamentoId)

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: ${orcamentoId}).`)
        return
      }
      const { nome, telefone } = dadosCliente

      await this.enviarNotificacao.execute({
        destinatario: telefone,
        mensagem: `Olá ${nome}! Preparamos uma proposta especial revisada para o seu veículo. Acesse o link para conferir as novas condições: [Link do Orçamento #${orcamento.getId().toValue()}]`
      })
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Falha ao disparar nova proposta para o cliente`, error)
    }
  }
}