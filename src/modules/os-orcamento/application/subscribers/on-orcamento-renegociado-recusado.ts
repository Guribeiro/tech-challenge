// src/modules/notificacoes/application/subscribers/on-orcamento-recusado.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-case/enviar-notificacao.js'
import { EncerrarOrdemServicoUseCase } from '../use-cases/ordens-servicos/encerrar-os-por-rejeicao.js'

export class OnOrcamentoRenegociadoRecusado implements EventHandler {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
    private readonly encerrarOrdemServico: EncerrarOrdemServicoUseCase
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
      await this.encerrarOrdemServico.execute({
        ordemServicoId: orcamento.getOrdemServicoId().toValue()
      })

      await this.enviarNotificacao.execute({
        destinatario: 'gerencia@oficina.com',
        mensagem: `O orçamento da OS #${orcamento.getOrdemServicoId().toValue()} foi REJEITADO DEFINITIVAMENTE pelo cliente após tentativas de renegociação. O processo foi encerrado.`
      })
    } catch (error) {
      console.error(`Falha ao notificar recepção sobre a recusa do orçamento ${orcamento.getId()}`, error)
    }
  }
}