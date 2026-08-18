import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { CriarCredenciaisUseCase } from '../use-cases/criar-credenciais.js'
import { Injectable, Logger } from '@nestjs/common'
import { ClienteCriadoEvent } from '@/modules/os-orcamento/domain/events/cliente-criado-event.js'

@Injectable()
export class OnClienteCriado implements EventHandler {
  private readonly logger = new Logger(OnClienteCriado.name)
  constructor(private readonly criarCredenciais: CriarCredenciaisUseCase) {
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
      const result = await this.criarCredenciais.execute({
        id: cliente.getId().toValue(),
        email: cliente.getEmail().getValor(),
        role: 'CLIENTE'
      })

      if (result.isLeft()) {
        this.logger.warn(`[Autenticação] Não foi possível criar credenciais para o cliente ID: ${cliente.getId().toValue()}.`)
        return
      }

      const usuario = result.value.usuario
      this.logger.log(`[Autenticação] Credenciais criadas com sucesso para o ID: ${cliente.getId().toValue()}. Usuário ID: ${usuario.getId().toValue()}`)

    } catch (error) {
      console.log(error)
      this.logger.error(`[Autenticação] Erro inesperado ao criar credenciais para o cliente ID: ${cliente.getId().toValue()}`, error instanceof Error ? error.stack : error)
    }
  }
}