import { AggregateRoot } from '../entities/aggregate-root.js'
import { DomainEvent } from './domain-event.js'

// Tipagem para a função que vai ouvir o evento
type DomainEventCallback = (event: any) => Promise<void> | void

export class DomainEvents {
  // Guarda todos os inscritos. Chave: Nome do Evento, Valor: Lista de Funções
  private static readonly handlersMap: Map<string, DomainEventCallback[]> = new Map()

  /**
   * Quem quiser ouvir um evento (ex: a política de notificação) chama esse método
   */
  public static register(callback: DomainEventCallback, eventClassName: string) {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, [])
    }

    this.handlersMap.get(eventClassName)?.push(callback)
  }

  public static clearSubscribers(): void {
    this.handlersMap.clear()
  }

  /**
   * Dispara o evento imediatamente para todos os inscritos ouvirem
   */
  public static dispatch(event: DomainEvent): void {
    const eventClassName = event.constructor.name
    const handlers = this.handlersMap.get(eventClassName) || []

    if (handlers.length === 0) return

    // Executa os handlers em segundo plano sem travar a requisição HTTP com await
    Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event)
        } catch (err) {
          console.error(`Error in handler for event ${eventClassName}:`, err)
          throw err
        }
      })
    ).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error(`[DomainEvents]: Event failure log for ${eventClassName}:`, result.reason)
        }
      })
    })
  }

  public static async dispatchEventsForAggregate(aggregate: AggregateRoot<any>): Promise<void> {
    const events = aggregate.domainEvents

    for (const event of events) {
      this.dispatch(event)
    }

    aggregate.clearEvents()
  }
}