import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRenegociadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-case/enviar-notificacao.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'

export class OnOrcamentoRenegociado implements EventHandler {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
    private readonly clienteRepository: ClienteRepository
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoRenegociadoEvent.name
    )
  }

  private async executar(event: OrcamentoRenegociadoEvent): Promise<void> {
    const { orcamento } = event

    try {
      const cliente = await this.clienteRepository.findById(orcamento.getClienteId().toValue())
      if (!cliente) return

      // Envia o novo orçamento linkado/atualizado para o WhatsApp do cliente
      await this.enviarNotificacao.execute({
        destinatario: cliente.getTelefone().getValor(),
        mensagem: `Olá! Preparamos uma proposta especial revisada para o seu veículo. Acesse o link para conferir as novas condições: [Link do Orçamento #${orcamento.getId()}]`
      })
    } catch (error) {
      console.error(`Falha ao disparar nova proposta para o cliente`, error)
    }
  }
}