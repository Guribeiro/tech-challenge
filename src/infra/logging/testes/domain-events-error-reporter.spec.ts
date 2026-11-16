import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { DomainEventsErrorReporter } from '../domain-events-error-reporter.js'
import { FakeTelemetry } from '@/infra/observability/testes/fake-telemetry.js'

class EventoTeste {}

describe('DomainEventsErrorReporter', () => {
  let telemetry: FakeTelemetry
  let reporter: DomainEventsErrorReporter

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => { })
    DomainEvents.clearSubscribers()
    telemetry = new FakeTelemetry()
    reporter = new DomainEventsErrorReporter(telemetry)
    reporter.onModuleInit()
  })

  afterEach(() => {
    reporter.onModuleDestroy()
    DomainEvents.clearSubscribers()
    vi.restoreAllMocks()
  })

  it('reporta falhas de handlers ao logger e à telemetria sem interromper os demais handlers', async () => {
    const handlerOk = vi.fn()
    DomainEvents.register(() => { throw new Error('falha na reserva') }, EventoTeste.name)
    DomainEvents.register(handlerOk, EventoTeste.name)

    await DomainEvents.dispatch(new EventoTeste() as never)

    expect(handlerOk).toHaveBeenCalled()
    expect(Logger.prototype.error).toHaveBeenCalled()
    expect(telemetry.events[0]).toEqual({
      name: 'IntegracaoFalhou',
      attributes: { integracao: 'evento-dominio', operacao: 'EventoTeste', erro: 'falha na reserva' },
    })
    expect(telemetry.errors).toHaveLength(1)
  })
})
