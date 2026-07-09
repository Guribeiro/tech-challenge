import { UniqueEntityID } from '../entities/unique-entity-id.js'
import { DomainEvent } from './domain-event.js'

// Tipagem para a função que vai ouvir o evento
type DomainEventCallback = (event: any) => Promise<void> | void

export class DomainEvents {
  // Guarda todos os inscritos. Chave: Nome do Evento, Valor: Lista de Funções
  private static handlersMap: Map<string, DomainEventCallback[]> = new Map()

  /**
   * Quem quiser ouvir um evento (ex: a política de notificação) chama esse método
   */
  public static register(callback: DomainEventCallback, eventClassName: string) {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, [])
    }

    this.handlersMap.get(eventClassName)?.push(callback)
  }

  /**
   * Dispara o evento imediatamente para todos os inscritos ouvirem
   */
  public static dispatch(event: DomainEvent) {
    const eventClassName = event.constructor.name
    const handlers = this.handlersMap.get(eventClassName) || []

    for (const handler of handlers) {
      // Executa a função de forma assíncrona para não travar o fluxo principal
      handler(event)
    }
  }
}