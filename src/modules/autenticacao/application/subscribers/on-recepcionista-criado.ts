import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { RecepcionistaCriadoEvent } from '@/modules/os-orcamento/domain/events/recepcionista-criado-event.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'

@Injectable()
export class OnRecepcionistaCriado implements EventHandler {
  private readonly logger = new Logger(OnRecepcionistaCriado.name)
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) {
    this.setupSubscriptions()

  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      RecepcionistaCriadoEvent.name
    )
  }

  private async handle(event: RecepcionistaCriadoEvent): Promise<void> {
    const { recepcionista } = event
    try {
      const result = await this.criarCredenciais.execute({
        id: recepcionista.getId().toValue(),
        email: recepcionista.getEmail().getValor(),
        role: 'RECEPCAO'
      })
      if (result.isLeft()) {
        this.logger.warn(`[Autenticação] Não foi possível criar credenciais para o recepcionista ID: ${recepcionista.getId().toValue()}.`)
        return
      }
      this.logger.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${recepcionista.getId().toValue()}`)
    } catch (error) {
      this.logger.error(`[Autenticação] Erro ao processar criação de credenciais:`, error instanceof Error ? error.stack : error)
    }
  }
}