// src/modules/autenticacao/application/subscribers/on-mecanico-contratado.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClienteCriadoEvent } from '@/modules/os-orcamento/domain/events/cliente-criado-event.js'

@Injectable()
export class OnClienteCriado implements EventHandler, OnModuleInit {
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) { }

  onModuleInit(): void {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.handle.bind(this),
      ClienteCriadoEvent.name
    )
  }

  private async handle(event: ClienteCriadoEvent): Promise<void> {
    const { cliente } = event
    try {
      await this.criarCredenciais.execute({
        id: cliente.getId().toValue(),
        email: cliente.getEmail().getValor(),
        role: 'CLIENTE'
      })

      console.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${cliente.getId().toValue()}`)
    } catch (error) {
      console.error(`[Autenticação] Erro ao processar criação de credenciais:`, error)
    }
  }
}