import { Injectable, OnModuleInit } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { RecepcionistaCriadoEvent } from '@/modules/os-orcamento/domain/events/recepcionista-criado-event.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'

@Injectable()
export class OnRecepcionistaCriado implements EventHandler, OnModuleInit {
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) { }

  onModuleInit(): void {
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
      await this.criarCredenciais.execute({
        id: recepcionista.getId().toValue(),
        email: recepcionista.getEmail().getValor(),
        role: 'RECEPCAO'
      })

      console.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${recepcionista.getId().toValue()}`)
    } catch (error) {
      console.error(`[Autenticação] Erro ao processar criação de credenciais:`, error)
    }
  }
}