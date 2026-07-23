import { AggregateRoot } from '../entities/aggregate-root.js'
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
  public static async dispatch(event: DomainEvent): Promise<void> {
    const eventClassName = event.constructor.name
    const handlers = this.handlersMap.get(eventClassName) || []

    // Aguarda a execução de todos os handlers de forma segura
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event))
    )

    // Loga eventuais erros em background sem quebrar o fluxo principal se necessário
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error(`Error handling event ${eventClassName}:`, result.reason)
      }
    })
  }

  public static async dispatchEventsForAggregate(aggregate: AggregateRoot<any>): Promise<void> {
    const events = aggregate.domainEvents

    for (const event of events) {
      await this.dispatch(event)
    }

    aggregate.clearEvents()
  }
}