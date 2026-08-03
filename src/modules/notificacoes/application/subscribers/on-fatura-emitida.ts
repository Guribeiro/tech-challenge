import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { ClienteOrcamentoGateway } from '@/modules/notificacoes/application/gateways/cliente-orcamento-gateway.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnFaturaEmitida implements EventHandler {
  private readonly logger = new Logger(OnFaturaEmitida.name)
  constructor(
    private readonly clienteOrcamentoGateway: ClienteOrcamentoGateway,
    private readonly enviarNotificacao: EnviarNotificacaoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      FaturaEmitidaEvent.name
    )
  }

  private async executar({ fatura }: FaturaEmitidaEvent): Promise<void> {
    const orcamentoId = fatura.getOrcamentoId().toValue()

    try {

      const dadosCliente = await this.clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId(orcamentoId)

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: ${orcamentoId}).`)
        return
      }
      const { nome, telefone, ordemServicoId } = dadosCliente
      const valorTotal = fatura.getValorTotal()

      // Dispara a notificação usando o SEU use-case existente!
      await this.enviarNotificacao.execute({
        destinatario: telefone,
        mensagem: `Olá, ${nome}! A sua fatura referente ao serviço (OS #${ordemServicoId}) foi emitida com sucesso no valor de R$ ${valorTotal.toFixed(2)}.`,
      })
      this.logger.log(`Notificação enviada com sucesso para o cliente ${nome} (OS #${ordemServicoId}) após emissão da fatura.`)
    } catch (error) {
      this.logger.error(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${fatura.getId().toValue()}`, error)
    }
  }
}