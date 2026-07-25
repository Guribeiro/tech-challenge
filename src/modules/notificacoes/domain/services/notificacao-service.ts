export interface EnviarNotificacaoProps {
  destinatario: string // Telefone ou E-mail
  mensagem: string
}

export abstract class NotificacaoService {
  abstract enviar(dados: EnviarNotificacaoProps): Promise<void>
}