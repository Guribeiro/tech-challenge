import { DomainEvents } from "@/core/events/domain-events.js";
import { EventHandler } from "@/core/events/event-handler.js";
import { UsuarioCriadoEvent } from "@/modules/autenticacao/domain/events/usuario-criado-event.js";
import { EnviarNotificacaoUseCase } from "../../domain/use-case/enviar-notificacao.js";

export class OnUsuarioCriado implements EventHandler {

  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      UsuarioCriadoEvent.name
    )
  }

  private async executar({ usuario, senhaPlana }: UsuarioCriadoEvent) {
    await this.enviarNotificacao.execute({
      destinatario: usuario.getEmail().getValor(),
      mensagem: `Olá! A sua senha provisória é ${senhaPlana}.`
    })
  }
}