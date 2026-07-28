import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRenegociadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRenegociado implements EventHandler, OnModuleInit {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
    private readonly clienteRepository: ClienteRepository
  ) { }

  onModuleInit(): void {
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

      await this.enviarNotificacao.execute({
        destinatario: cliente.getTelefone().getValor(),
        mensagem: `Olá! Preparamos uma proposta especial revisada para o seu veículo. Acesse o link para conferir as novas condições: [Link do Orçamento #${orcamento.getId()}]`
      })
    } catch (error) {
      console.error(`Falha ao disparar nova proposta para o cliente`, error)
    }
  }
}