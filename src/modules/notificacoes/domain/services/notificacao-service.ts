export interface EnviarNotificacaoProps {
  destinatario: string // Telefone ou E-mail
  mensagem: string
}

export interface NotificacaoService {
  enviar(dados: EnviarNotificacaoProps): Promise<void>
}