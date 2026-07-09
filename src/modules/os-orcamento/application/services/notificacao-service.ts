export interface EnviarNotificacaoInput {
  destinatario: string
  mensagem: string
}

export interface NotificacaoService {
  enviar(dados: EnviarNotificacaoInput): Promise<void>
}