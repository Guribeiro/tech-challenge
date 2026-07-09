import { NotificacaoService } from "../../application/services/notificacao-service.js"

export interface EnviarNotificacaoInput {
  destinatario: string
  mensagem: string
}

export class InMemoryNotificacaoService implements NotificacaoService {
  // Uma lista em memória que armazena todas as notificações disparadas
  public envios: EnviarNotificacaoInput[] = []

  async enviar(dados: EnviarNotificacaoInput): Promise<void> {
    // Em vez de enviar um WhatsApp real, nós apenas guardamos o envio no array
    this.envios.push(dados)
  }

  /**
   * Helper útil para limpar o histórico entre os testes, se necessário
   */
  public limpar(): void {
    this.envios = []
  }
}