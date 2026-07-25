import { Module } from '@nestjs/common'
import { EnviarNotificacaoUseCase } from './domain/use-cases/enviar-notificacao.js'
import { OnUsuarioCriado } from './application/subscribers/on-usuario-criado.js'
import { NotificacaoService } from './domain/services/notificacao-service.js'
import { InMemoryNotificacaoService } from './testes/services/in-memory-notificacao-service.js'
@Module({
  imports: [],
  providers: [
    EnviarNotificacaoUseCase,
    OnUsuarioCriado,
    {
      provide: NotificacaoService,
      useClass: InMemoryNotificacaoService,
    },

  ],
  exports: [
    EnviarNotificacaoUseCase,
  ],
})
export class NotificacoesModule { }