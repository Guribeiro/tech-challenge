import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Options } from 'pino-http'
import { resolverRequestId } from './request-id.js'

const ROTAS_SEM_LOG_DE_ACESSO = ['/api/health']

export interface ConfiguracaoLogs {
  ambiente: string
  nivel?: string
  servico?: string
  appEnv?: string
}

/**
 * Opções do pino-http: logs JSON com correlation id por requisição.
 *
 * - O logger da requisição carrega só `request_id` (quietReqLogger), herdado por toda
 *   linha emitida durante ela (inclusive `new Logger(Contexto)` do NestJS em casos de uso
 *   e subscribers de eventos).
 * - `request_id` não vai em customProps: o pino-http aplica customProps também no log de
 *   conclusão, sobre o logger que já tem a chave, o que a duplicava no JSON.
 */
export function criarOpcoesPinoHttp(config: ConfiguracaoLogs): Options {
  return {
    level: config.nivel ?? (config.ambiente === 'test' ? 'silent' : 'info'),
    messageKey: 'message',
    base: {
      service: config.servico ?? 'oficina-app',
      env: config.appEnv ?? config.ambiente,
    },
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    genReqId: (req: IncomingMessage, res: ServerResponse) => resolverRequestId(req, res),
    quietReqLogger: true,
    customAttributeKeys: {
      reqId: 'request_id',
      responseTime: 'duration_ms',
    },
    customProps: (req: IncomingMessage & { user?: { sub?: string; role?: string } }) =>
      req.user?.sub ? { user_id: req.user.sub, user_role: req.user.role } : {},
    autoLogging: {
      ignore: (req: IncomingMessage) =>
        ROTAS_SEM_LOG_DE_ACESSO.some((rota) => req.url?.startsWith(rota)),
    },
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    serializers: {
      req: (req: { id: string; method: string; url: string; headers: Record<string, string> }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        user_agent: req.headers?.['user-agent'],
      }),
      res: (res: { statusCode: number }) => ({ status_code: res.statusCode }),
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.senha',
        '*.password',
        '*.cpf',
        '*.documento',
      ],
      censor: '[REDACTED]',
    },
  }
}
