import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { OrcamentoEnviadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-enviado-event.js'
import { Injectable, Logger } from '@nestjs/common'
import { ClienteOrcamentoGateway } from '../gateways/cliente-orcamento-gateway.js'

@Injectable()
export class OnOrcamentoEnviado implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoEnviado.name)
  constructor(
    private readonly clienteOrcamentoGateway: ClienteOrcamentoGateway,
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
  ) {
    this.setupSubscriptions()
  }
  // 1. Registra o ouvinte no ecossistema global de eventos da aplicação
  setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoEnviadoEvent.name
    )
  }

  private async executar({ orcamento }: OrcamentoEnviadoEvent): Promise<void> {
    const orcamentoId = orcamento.getId().toValue()
    try {
      const dadosCliente = await this.clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId(orcamentoId)

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: ${orcamentoId}).`)
        return
      }
      const { nome, telefone } = dadosCliente

      const valorTotal = orcamento.getValorTotalGeral()

      await this.enviarNotificacao.execute({
        destinatario: telefone,
        mensagem: `Olá ${nome}! O orçamento ficou em R$ ${valorTotal}.`
      })
      this.logger.log(`Notificação enviada com sucesso para o cliente ${nome} (Orçamento #${orcamento.getId().toValue()}) após envio do orçamento.`)
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Falha no processo automático pós-envio do orçamento (Orçamento ID: ${orcamento.getId().toValue()})`, error)
    }
  }
}