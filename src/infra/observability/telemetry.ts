export type TelemetryAttributes = Record<string, string | number | boolean | null | undefined>

/** Eventos customizados enviados ao APM (consultáveis via NRQL nos dashboards). */
export const TELEMETRY_EVENTS = {
  ORDEM_SERVICO_STATUS_ALTERADA: 'OrdemServicoStatusAlterada',
  INTEGRACAO_FALHOU: 'IntegracaoFalhou',
} as const

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS]

export type Integracao = 'email' | 'webhook-pagamento' | 'evento-dominio'

/**
 * Porta de telemetria. A infraestrutura depende desta abstração e não do SDK do
 * fornecedor de APM, o que mantém a troca de ferramenta (ex.: Datadog) localizada.
 */
export abstract class Telemetry {
  abstract recordEvent(name: TelemetryEventName, attributes: TelemetryAttributes): void
  abstract noticeError(error: unknown, attributes?: TelemetryAttributes): void

  public recordIntegrationFailure(integracao: Integracao, operacao: string, error: unknown): void {
    const erro = error instanceof Error ? error.message : String(error)

    this.recordEvent(TELEMETRY_EVENTS.INTEGRACAO_FALHOU, { integracao, operacao, erro })
    this.noticeError(error, { integracao, operacao })
  }
}
