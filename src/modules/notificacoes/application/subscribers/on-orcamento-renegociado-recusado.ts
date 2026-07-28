import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EnviarNotificacaoUseCase } from '../../domain/use-cases/enviar-notificacao.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRenegociadoRecusado implements EventHandler, OnModuleInit {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
  ) { }

  onModuleInit(): void {
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
    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId()}`, error)
    }
  }
}