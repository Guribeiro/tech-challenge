import { Module } from '@nestjs/common'
import { EnviarNotificacaoUseCase } from './domain/use-cases/enviar-notificacao.js'
import { OnUsuarioCriado } from './application/subscribers/on-usuario-criado.js'
import { OnDiagnosticoInicializado } from './application/subscribers/on-diagnostico-inicializado.js'
import { NotificacaoService } from './domain/services/notificacao-service.js'
import { InMemoryNotificacaoService } from './testes/services/in-memory-notificacao-service.js'
import { ClienteRepository } from '../os-orcamento/domain/repositories/clientes-repository.js'
import { PrismaClienteRepository } from '@/infra/database/prisma/repositories/prisma-cliente.repository.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

@Module({
  imports: [],
  providers: [
    PrismaService,
    EnviarNotificacaoUseCase,
    OnUsuarioCriado,
    OnDiagnosticoInicializado,
    {
      provide: NotificacaoService,
      useClass: InMemoryNotificacaoService,
    },
    {
      provide: ClienteRepository,
      useClass: PrismaClienteRepository,
    },

  ],
  exports: [
    EnviarNotificacaoUseCase,
  ],
})
export class NotificacoesModule { }