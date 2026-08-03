// src/modules/notificacoes/application/subscribers/on-orcamento-recusado.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRecusado implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoRecusado.name)
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoRecusadoEvent.name
    )
  }

  private async executar(event: OrcamentoRecusadoEvent): Promise<void> {
    const { orcamento } = event

    try {
      // Notifica a recepcionista (ou o canal de atendimento) para renegociar
      await this.enviarNotificacao.execute({
        destinatario: 'recepcao@oficina.com', // Ou buscar dinamicamente a recepcionista responsável
        mensagem: `Atenção! O cliente recusou o orçamento original da OS #${orcamento.getOrdemServicoId().toValue()}. Inicie o processo de renegociação.`
      })
      this.logger.log(`Notificação enviada para a recepção sobre a recusa do orçamento ${orcamento.getId().toValue()}.`)
    } catch (error) {
      this.logger.error(`Falha ao notificar recepção sobre a recusa do orçamento ${orcamento.getId().toValue()}`, error)
    }
  }
}