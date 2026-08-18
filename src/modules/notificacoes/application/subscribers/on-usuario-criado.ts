import { DomainEvents } from "@/core/events/domain-events.js";
import { EventHandler } from "@/core/events/event-handler.js";
import { UsuarioCriadoEvent } from "@/modules/autenticacao/domain/events/usuario-criado-event.js";
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OnUsuarioCriado implements EventHandler {
  private readonly logger = new Logger(OnUsuarioCriado.name)
  constructor(
    private readonly criarNotificacao: CriarNotificacaoUseCase,
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
      await this.criarNotificacao.execute({
        destinatarioId: usuario.getId().toValue(),
        titulo: 'Credenciais de acesso',
        conteudo: `Olá! A sua senha provisória é ${senhaPlana}.`,
        template: 'usuario-criado',
        contexto: {
          nome: usuario.getEmail().getValor(),
          email: usuario.getEmail().getValor(),
          senhaPlana,
        },
      })

      this.logger.log(`[Notification Success]: Notificação enviada para o usuário ${usuario.getEmail().getValor()}`)
    } catch (error) {
      this.logger.error(`[Notification Error]: Falha ao disparar notificação para o usuário ${usuario.getEmail().getValor()}`, error)
    }
  }
}