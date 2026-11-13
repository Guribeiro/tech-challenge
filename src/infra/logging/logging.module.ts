import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolverRequestId } from './request-id.js'
import { DomainEventsErrorReporter } from './domain-events-error-reporter.js'

const ROTAS_SEM_LOG_DE_ACESSO = ['/api/health']

/**
 * Logs estruturados em JSON (pino) com correlation id por requisição.
 *
 * - Toda linha de log emitida durante a requisição (inclusive via `new Logger(Contexto)`
 *   do NestJS, em casos de uso e subscribers de eventos) carrega `request_id`.
 * - Quando o agente New Relic está ativo, ele instrumenta o pino e acrescenta
 *   `trace.id`/`span.id` (logs in context), ligando log ↔ trace no APM.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ambiente = config.get<string>('NODE_ENV', 'development')

        return {
          pinoHttp: {
            level: config.get<string>('LOG_LEVEL', ambiente === 'test' ? 'silent' : 'info'),
            messageKey: 'message',
            base: {
              service: config.get<string>('SERVICE_NAME', 'oficina-app'),
              env: config.get<string>('APP_ENV', ambiente),
            },
            formatters: {
              level: (label: string) => ({ level: label }),
            },
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            genReqId: (req: IncomingMessage, res: ServerResponse) => resolverRequestId(req, res),
            customAttributeKeys: {
              responseTime: 'duration_ms',
            },
            customProps: (req: IncomingMessage & { id?: unknown; user?: { sub?: string; role?: string } }) => ({
              request_id: req.id,
              ...(req.user?.sub && { user_id: req.user.sub, user_role: req.user.role }),
            }),
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
          },
        }
      },
    }),
  ],
  providers: [DomainEventsErrorReporter],
})
export class LoggingModule { }
