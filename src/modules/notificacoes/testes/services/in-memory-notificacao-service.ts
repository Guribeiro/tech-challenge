import { EnviarNotificacaoProps, NotificacaoService } from '../../domain/services/notificacao-service.js'

export class InMemoryNotificacaoService implements NotificacaoService {
  public envios: EnviarNotificacaoProps[] = []

  async enviar(props: EnviarNotificacaoProps): Promise<void> {
    this.envios.push(props)
  }

  /**
   * Métodos auxiliares para facilitação de asserções em testes
   */
  public obterUltimoEnvio(): EnviarNotificacaoProps | undefined {
    return this.envios.at(-1)
  }

  public limpar(): void {
    this.envios = []
  }
}