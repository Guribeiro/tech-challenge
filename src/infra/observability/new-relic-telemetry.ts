import { Injectable, Logger } from '@nestjs/common'
import { createRequire } from 'node:module'
import { Telemetry, TelemetryAttributes, TelemetryEventName } from './telemetry.js'

type NewRelicApi = {
  recordCustomEvent(eventType: string, attributes: Record<string, string | number | boolean>): void
  noticeError(error: Error, customAttributes?: Record<string, string | number | boolean>): void
}

/**
 * Retorna a API do agente apenas se ele foi pré-carregado no processo
 * (`node --import newrelic/esm-loader.mjs -r newrelic ...`). Nunca inicializa o
 * agente por conta própria: em testes e desenvolvimento a telemetria é no-op.
 */
export function carregarAgenteNewRelic(): NewRelicApi | null {
  try {
    const require = createRequire(import.meta.url)
    const caminho = require.resolve('newrelic')
    return (require.cache[caminho]?.exports as NewRelicApi | undefined) ?? null
  } catch {
    return null
  }
}

function limparAtributos(attributes: TelemetryAttributes = {}): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(attributes).filter(
      (entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined,
    ),
  )
}

@Injectable()
export class NewRelicTelemetry extends Telemetry {
  private readonly logger = new Logger(NewRelicTelemetry.name)

  constructor(private readonly agente: NewRelicApi | null = carregarAgenteNewRelic()) {
    super()
  }

  recordEvent(name: TelemetryEventName, attributes: TelemetryAttributes): void {
    if (!this.agente) return

    try {
      this.agente.recordCustomEvent(name, limparAtributos(attributes))
    } catch (error) {
      this.logger.warn(`Falha ao registrar evento ${name} no New Relic: ${String(error)}`)
    }
  }

  noticeError(error: unknown, attributes?: TelemetryAttributes): void {
    if (!this.agente) return

    try {
      const erro = error instanceof Error ? error : new Error(String(error))
      this.agente.noticeError(erro, limparAtributos(attributes))
    } catch (falha) {
      this.logger.warn(`Falha ao registrar erro no New Relic: ${String(falha)}`)
    }
  }
}
