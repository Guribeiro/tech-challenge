import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EnviarNotificacaoUseCase } from '../../domain/use-cases/enviar-notificacao.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRenegociadoRecusado implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoRenegociadoRecusado.name)
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
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
      await this.enviarNotificacao.execute({
        destinatario: 'gerencia@oficina.com',
        mensagem: `O orçamento da OS #${ordemServico.getId().toValue()} foi REJEITADO DEFINITIVAMENTE pelo cliente após tentativas de renegociação. O processo foi encerrado.`
      })
      this.logger.log(`Notificação enviada para a gerência sobre a recusa definitiva do orçamento da OS #${ordemServico.getId().toValue()}.`)
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Falha ao enviar notificação sobre a recusa definitiva do orçamento da OS #${ordemServico.getId().toValue()}`, error)
    }
  }
}