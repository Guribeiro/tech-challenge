import { NotificacaoService } from "../../domain/services/notificacao-service.js"

export interface EnviarNotificacaoInput {
  destinatario: string
  mensagem: string
}

export class InMemoryNotificacaoService implements NotificacaoService {
  public envios: EnviarNotificacaoInput[] = []

  async enviar(dados: EnviarNotificacaoInput): Promise<void> {
    // Em vez de enviar um WhatsApp real, nós apenas guardamos o envio no array
    console.log('[NOTIFICACAO SERVICE]', dados)
    this.envios.push(dados)
  }

  /**
   * Helper útil para limpar o histórico entre os testes, se necessário
   */
  public limpar(): void {
    this.envios = []
  }
}