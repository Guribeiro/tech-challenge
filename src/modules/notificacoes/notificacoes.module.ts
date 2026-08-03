import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { PrismaClienteRepository } from '@/infra/database/prisma/repositories/prisma-cliente.repository.js'
import { Module } from '@nestjs/common'
import { ClienteRepository } from '../os-orcamento/domain/repositories/clientes-repository.js'
import { OnDiagnosticoInicializado } from './application/subscribers/on-diagnostico-inicializado.js'
import { OnOrcamentoEnviado } from './application/subscribers/on-orcamento-enviado.js'
import { OnExecucaoIniciada } from './application/subscribers/on-os-execucao-iniciada.js'
import { OnUsuarioCriado } from './application/subscribers/on-usuario-criado.js'
import { NotificacaoService } from './domain/services/notificacao-service.js'
import { EnviarNotificacaoUseCase } from './domain/use-cases/enviar-notificacao.js'
import { InMemoryNotificacaoService } from './testes/services/in-memory-notificacao-service.js'
import { ClienteOrcamentoGateway } from './application/gateways/cliente-orcamento-gateway.js'
import { DbClienteOrcamentoGateway } from '@/infra/gateways/db-cliente-orcamento-gateway.js'
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js'
import { DbClienteOrdemServicoGateway } from '@/infra/gateways/db-cliente-ordem-servico-gateway.js'

import { OsOrcamentoModule } from '../os-orcamento/os-orcamento.module.js'
import { OnFaturaEmitida } from './application/subscribers/on-fatura-emitida.js'
import { OnOrcamentoRecusado } from './application/subscribers/on-orcamento-recusado.js'
import { OnOrcamentoRenegociadoRecusado } from './application/subscribers/on-orcamento-renegociado-recusado.js'
import { OnOrcamentoRenegociado } from './application/subscribers/on-orcamento-renegociado.js'
import { OnTermoLiberacaoEmitido } from './application/subscribers/on-termo-liberacao-emitido.js'

@Module({
  imports: [
    OsOrcamentoModule
  ],
  providers: [
    PrismaService,
    EnviarNotificacaoUseCase,
    OnUsuarioCriado,
    OnDiagnosticoInicializado,
    OnOrcamentoEnviado,
    OnExecucaoIniciada,
    OnFaturaEmitida,
    OnOrcamentoRecusado,
    OnOrcamentoRenegociadoRecusado,
    OnOrcamentoRenegociado,
    OnTermoLiberacaoEmitido,
    {
      provide: NotificacaoService,
      useClass: InMemoryNotificacaoService,
    },
    {
      provide: ClienteRepository,
      useClass: PrismaClienteRepository,
    },
    {
      provide: ClienteOrdemServicoGateway,
      useClass: DbClienteOrdemServicoGateway
    },
    {
      provide: ClienteOrcamentoGateway,
      useClass: DbClienteOrcamentoGateway
    }

  ],
  exports: [
    EnviarNotificacaoUseCase,
  ],
})
export class NotificacoesModule { }