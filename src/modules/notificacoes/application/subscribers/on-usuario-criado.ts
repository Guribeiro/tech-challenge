import { DomainEvents } from "@/core/events/domain-events.js";
import { EventHandler } from "@/core/events/event-handler.js";
import { UsuarioCriadoEvent } from "@/modules/autenticacao/domain/events/usuario-criado-event.js";
import { EnviarNotificacaoUseCase } from "../../domain/use-cases/enviar-notificacao.js";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OnUsuarioCriado implements EventHandler {
  private readonly logger = new Logger(OnUsuarioCriado.name)
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
    try {
      await this.enviarNotificacao.execute({
        destinatario: usuario.getEmail().getValor(),
        mensagem: `Olá! A sua senha provisória é ${senhaPlana}.`
      })

      this.logger.log(`[Notification Success]: Notificação enviada para o usuário ${usuario.getEmail().getValor()}`)
    } catch (error) {
      this.logger.error(`[Notification Error]: Falha ao disparar notificação para o usuário ${usuario.getEmail().getValor()}`, error)
    }
  }
}