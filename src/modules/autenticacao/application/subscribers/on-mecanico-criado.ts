import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { MecanicoCriadoEvent } from '@/modules/os-orcamento/domain/events/mecanico-criado-event.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnMecanicoCriado implements EventHandler {
  private readonly logger = new Logger(OnMecanicoCriado.name)
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      MecanicoCriadoEvent.name
    )
  }

  private async handle(event: MecanicoCriadoEvent): Promise<void> {
    const { mecanico } = event
    try {
      const result = await this.criarCredenciais.execute({
        id: mecanico.getId().toValue(),
        email: mecanico.getEmail().getValor(),
        role: 'MECANICO'
      })

      if (result.isLeft()) {
        console.warn(`[Autenticação] Não foi possível criar credenciais para o mecânico ID: ${mecanico.getId().toValue()}.`)
        return
      }

      this.logger.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${mecanico.getId().toValue()}.`)
    } catch (error) {
      this.logger.error(`[Autenticação] Erro ao processar criação de credenciais:`, error instanceof Error ? error.stack : error)
    }
  }
}