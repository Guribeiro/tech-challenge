import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { DomainEventsErrorReporter } from './domain-events-error-reporter.js'
import { criarOpcoesPinoHttp } from './logging.options.js'

/**
 * Logs estruturados em JSON (pino) com correlation id por requisição
 * (opções em logging.options.ts).
 *
 * Quando o agente New Relic está ativo, ele instrumenta o pino e acrescenta
 * `trace.id`/`span.id` (logs in context), ligando log ↔ trace no APM.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ambiente = config.get<string>('NODE_ENV', 'development')

        return {
          pinoHttp: criarOpcoesPinoHttp({
            ambiente,
            nivel: config.get<string>('LOG_LEVEL'),
            servico: config.get<string>('SERVICE_NAME'),
            appEnv: config.get<string>('APP_ENV'),
          }),
        }
      },
    }),
  ],
  providers: [DomainEventsErrorReporter],
})
export class LoggingModule { }
