// src/modules/notificacoes/application/subscribers/on-orcamento-recusado.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-case/enviar-notificacao.js'

export class OnOrcamentoRecusado implements EventHandler {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase
    // Se precisar buscar o ID da recepcionista ou dados da OS, injete os repositórios aqui
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
    } catch (error) {
      console.error(`Falha ao notificar recepção sobre a recusa do orçamento ${orcamento.getId()}`, error)
    }
  }
}