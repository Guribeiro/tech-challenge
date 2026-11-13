import { AggregateRoot } from '../entities/aggregate-root.js'
import { DomainEvent } from './domain-event.js'

// Tipagem para a função que vai ouvir o evento
type DomainEventCallback = (event: any) => Promise<void> | void

/**
 * Recebe falhas de handlers de eventos. O núcleo não depende de framework:
 * a infraestrutura substitui o padrão (console) por logger estruturado + APM.
 */
export type DomainEventErrorReporter = (eventClassName: string, error: unknown) => void

const reporterPadrao: DomainEventErrorReporter = (eventClassName, error) => {
  console.error(`[DomainEvents]: Event failure log for ${eventClassName}:`, error)
}

export class DomainEvents {
  // Guarda todos os inscritos. Chave: Nome do Evento, Valor: Lista de Funções
  private static readonly handlersMap: Map<string, DomainEventCallback[]> = new Map()
  private static errorReporter: DomainEventErrorReporter = reporterPadrao

  public static setErrorReporter(reporter: DomainEventErrorReporter | null): void {
    this.errorReporter = reporter ?? reporterPadrao
  }

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
  public static async dispatch(event: DomainEvent): Promise<void> {
    const eventClassName = event.constructor.name
    const handlers = this.handlersMap.get(eventClassName) || []

    if (handlers.length === 0) return

    const results = await Promise.allSettled(
      handlers.map(async (handler) => handler(event))
    )

    results.forEach((result) => {
      if (result.status === 'rejected') {
        this.errorReporter(eventClassName, result.reason)
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