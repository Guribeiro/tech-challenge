import { NewRelicTelemetry, carregarAgenteNewRelic } from '../new-relic-telemetry.js'
import { TELEMETRY_EVENTS } from '../telemetry.js'
import { FakeTelemetry } from './fake-telemetry.js'

describe('NewRelicTelemetry', () => {
  const makeAgente = () => ({
    recordCustomEvent: vi.fn(),
    noticeError: vi.fn(),
  })

  it('não carrega o agente quando ele não foi pré-carregado no processo', () => {
    expect(carregarAgenteNewRelic()).toBeNull()
  })

  it('é no-op sem agente', () => {
    const telemetry = new NewRelicTelemetry(null)

    expect(() => telemetry.recordEvent(TELEMETRY_EVENTS.INTEGRACAO_FALHOU, { a: 1 })).not.toThrow()
    expect(() => telemetry.noticeError(new Error('x'))).not.toThrow()
  })

  it('registra evento customizado removendo atributos nulos', () => {
    const agente = makeAgente()
    const telemetry = new NewRelicTelemetry(agente)

    telemetry.recordEvent(TELEMETRY_EVENTS.ORDEM_SERVICO_STATUS_ALTERADA, {
      ordemServicoId: 'os-1',
      statusAnterior: null,
      statusNovo: 'RECEBIDA',
      duracaoNoStatusAnteriorSeg: undefined,
    })

    expect(agente.recordCustomEvent).toHaveBeenCalledWith('OrdemServicoStatusAlterada', {
      ordemServicoId: 'os-1',
      statusNovo: 'RECEBIDA',
    })
  })

  it('converte valores não-Error antes de notificar', () => {
    const agente = makeAgente()
    const telemetry = new NewRelicTelemetry(agente)

    telemetry.noticeError('falhou', { integracao: 'email' })

    expect(agente.noticeError).toHaveBeenCalledWith(expect.any(Error), { integracao: 'email' })
    expect(agente.noticeError.mock.calls[0][0].message).toBe('falhou')
  })

  it('não propaga falhas do agente', () => {
    const agente = makeAgente()
    agente.recordCustomEvent.mockImplementation(() => { throw new Error('agente indisponível') })
    const telemetry = new NewRelicTelemetry(agente)

    expect(() => telemetry.recordEvent(TELEMETRY_EVENTS.INTEGRACAO_FALHOU, {})).not.toThrow()
  })
})

describe('Telemetry.recordIntegrationFailure', () => {
  it('registra o evento IntegracaoFalhou e notifica o erro', () => {
    const telemetry = new FakeTelemetry()
    const erro = new Error('SMTP indisponível')

    telemetry.recordIntegrationFailure('email', 'enviar-notificacao', erro)

    expect(telemetry.events).toEqual([
      {
        name: 'IntegracaoFalhou',
        attributes: { integracao: 'email', operacao: 'enviar-notificacao', erro: 'SMTP indisponível' },
      },
    ])
    expect(telemetry.errors).toEqual([
      { error: erro, attributes: { integracao: 'email', operacao: 'enviar-notificacao' } },
    ])
  })
})
