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

    if (!destinatario || !mensagem.trim()) {
      throw new Error("Destinatário e mensagem são obrigatórios para realizar o envio.")
    }

    // 1. Delega o envio real para o serviço de infraestrutura integrado
    await this.notificacaoService.enviar({
      destinatario,
      mensagem
    })

    // 2. Aqui você poderia criar uma entidade 'Notificacao' e salvar no repositório

    return { sucesso: true }
  }
}