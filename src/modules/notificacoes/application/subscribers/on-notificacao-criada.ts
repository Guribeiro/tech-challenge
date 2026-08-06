import { Injectable, Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { NotificacaoCriadaEvent } from '@/modules/notificacoes/domain/events/notificacao-criada-event.js'
import { NotificacaoService } from '@/modules/notificacoes/domain/services/notificacao-service.js'
import { UsuariosRepository } from '@/modules/autenticacao/domain/repositories/usuarios-repository.js'

@Injectable()
export class OnNotificacaoCriada implements EventHandler {
  private readonly logger = new Logger(OnNotificacaoCriada.name)

  constructor(
    private readonly notificacaoService: NotificacaoService,
    private readonly usuariosRepository: UsuariosRepository, // Injeção necessária para buscar o e-mail
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      NotificacaoCriadaEvent.name,
    )
  }

  private async executar(event: NotificacaoCriadaEvent): Promise<void> {
    const { notificacao } = event

    try {
      const usuarioId = notificacao.getDestinatarioId().toValue()
      const usuario = await this.usuariosRepository.findById(usuarioId)

      if (!usuario) {
        this.logger.error(
          `[Notification Error]: Usuário com ID ${usuarioId} não foi encontrado para envio da notificação.`,
        )
        return
      }

      await this.notificacaoService.enviar({
        destinatario: usuario.getEmail().getValor(),
        assunto: notificacao.getTitulo(),
        template: notificacao.getTemplate(),
        contexto: notificacao.getContexto(),
      })

      this.logger.log(
        `[Notification Success]: Notificação ${notificacao.getId().toValue()} enviada para ${usuario.getEmail().getValor()}`,
      )
    } catch (error) {
      this.logger.error(
        `[Notification Error]: Falha ao disparar notificação ${notificacao.getId().toValue()}`,
        error,
      )
    }
  }
}