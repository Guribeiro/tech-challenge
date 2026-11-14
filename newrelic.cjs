'use strict'

/**
 * Configuração do agente New Relic (APM).
 *
 * O agente só é carregado quando o processo é iniciado com:
 *   node --import newrelic/esm-loader.mjs -r newrelic dist/infra/main.js
 * (CMD da imagem de produção). Valores sensíveis e específicos de ambiente vêm de
 * variáveis de ambiente injetadas pelo Kubernetes Secret/ConfigMap:
 *   NEW_RELIC_LICENSE_KEY, NEW_RELIC_APP_NAME, NEW_RELIC_ENABLED, NEW_RELIC_LOG_LEVEL
 * Variáveis de ambiente têm precedência sobre este arquivo.
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'oficina-app'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  // Sem licença o agente fica desligado e a aplicação sobe normalmente.
  agent_enabled: process.env.NEW_RELIC_ENABLED !== 'false' && Boolean(process.env.NEW_RELIC_LICENSE_KEY),
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    // Log do próprio agente no stdout (coletado junto com os logs do container).
    filepath: 'stdout',
  },
  distributed_tracing: {
    enabled: true,
  },
  application_logging: {
    enabled: true,
    forwarding: {
      // Envia os logs JSON (pino) ao New Relic com trace.id/span.id (logs in context).
      enabled: true,
      max_samples_stored: 10000,
    },
    metrics: {
      enabled: true,
    },
    local_decorating: {
      enabled: false,
    },
  },
  custom_insights_events: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
  },
  error_collector: {
    enabled: true,
    // 4xx são respostas de negócio esperadas (validação, autorização), não falhas.
    ignore_status_codes: [400, 401, 403, 404, 409, 422],
  },
  rules: {
    ignore: ['^/api/health'],
  },
  allow_all_headers: false,
  attributes: {
    exclude: [
      'request.headers.authorization',
      'request.headers.cookie',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
}
