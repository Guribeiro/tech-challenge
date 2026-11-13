import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'

/**
 * Encaminha falhas de handlers de eventos de domínio para o logger estruturado,
 * em vez do console, para que entrem nos logs JSON com request_id.
 */
@Injectable()
export class DomainEventsErrorReporter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DomainEvents')

  onModuleInit(): void {
    DomainEvents.setErrorReporter((eventClassName, error) => {
      this.logger.error(
        { event: eventClassName, err: error },
        `Falha no processamento do evento de domínio ${eventClassName}`,
      )
    })
  }

  onModuleDestroy(): void {
    DomainEvents.setErrorReporter(null)
  }
}
