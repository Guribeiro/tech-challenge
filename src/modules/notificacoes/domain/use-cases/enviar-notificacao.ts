import { NotificacaoService } from "../services/notificacao-service.js"

interface EnviarNotificacaoInput {
  destinatario: string
  mensagem: string
}

interface EnviarNotificacaoOutput {
  sucesso: boolean
}

export class EnviarNotificacaoUseCase {
  constructor(
    private readonly notificacaoService: NotificacaoService
    // Se quiser salvar no banco futuramente, injete o NotificacaoRepository aqui
  ) { }

  public async execute({
    destinatario,
    mensagem
  }: EnviarNotificacaoInput): Promise<EnviarNotificacaoOutput> {

    await this.notificacaoService.enviar({
      destinatario,
      mensagem
    })

    return { sucesso: true }
  }
}