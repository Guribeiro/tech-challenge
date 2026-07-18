// src/modules/autenticacao/application/subscribers/on-mecanico-contratado.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { MecanicoCriadoEvent } from '@/modules/os-orcamento/domain/events/mecanico-criado-event.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'

export class OnMecanicoCriado implements EventHandler {
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    // Registra a escuta do evento vindo do módulo de OS/Oficina
    DomainEvents.register(
      this.handle.bind(this),
      MecanicoCriadoEvent.name
    )
  }

  private async handle(event: MecanicoCriadoEvent): Promise<void> {
    const { mecanico } = event
    try {
      await this.criarCredenciais.execute({
        id: mecanico.getId().toValue(),
        email: mecanico.getEmail().getValor(),
        role: 'MECANICO'
      })

      console.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${mecanico.getId().toValue()}`)
    } catch (error) {
      console.error(`[Autenticação] Erro ao processar criação de credenciais:`, error)
    }
  }
}