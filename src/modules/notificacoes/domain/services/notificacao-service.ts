// src/modules/notificacoes/domain/services/notificacao-service.ts

export interface EnviarNotificacaoProps {
  destinatario: string
  assunto: string
  mensagem?: string
  template?: string
  contexto?: Record<string, unknown>
}

export abstract class NotificacaoService {
  abstract enviar(dados: EnviarNotificacaoProps): Promise<void>
}