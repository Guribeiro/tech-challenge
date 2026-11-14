import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { Telemetry } from '@/infra/observability/telemetry.js'

/**
 * Encaminha falhas de handlers de eventos de domínio (reserva de estoque,
 * encerramento de OS, notificações etc.) para o logger estruturado e para o APM,
 * onde alimentam o alerta de falhas no processamento de ordens de serviço.
 */
@Injectable()
export class DomainEventsErrorReporter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DomainEvents')

  constructor(private readonly telemetry: Telemetry) { }

  onModuleInit(): void {
    DomainEvents.setErrorReporter((eventClassName, error) => this.report(eventClassName, error))
  }

  onModuleDestroy(): void {
    DomainEvents.setErrorReporter(null)
  }

  public report(eventClassName: string, error: unknown): void {
    this.logger.error(
      { event: eventClassName, err: error },
      `Falha no processamento do evento de domínio ${eventClassName}`,
    )
    this.telemetry.recordIntegrationFailure('evento-dominio', eventClassName, error)
  }
}
