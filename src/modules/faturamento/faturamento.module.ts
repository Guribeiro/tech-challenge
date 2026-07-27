// src/modules/faturamento/faturamento.module.ts
import { Module } from '@nestjs/common'
import { OrcamentoGateway } from './application/gateways/orcamento-gateway.js'
import { DbOrcamentoGateway } from '@/infra/gateways/db-orcamento-gateway.js'
import { OsOrcamentoModule } from '@/modules/os-orcamento/os-orcamento.module.js' // Módulo que exporta o OrcamentoRepository

import { FaturaRepository } from './domain/repositories/faturas-repository.js'
import { PrismaFaturaRepository } from '@/infra/database/prisma/repositories/prisma-fatura-repository.js'
import { EmitirFaturaUseCase } from './application/use-cases/emitir-fatura.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { OnOrdemServicoFinalizadaEmitirFatura } from './application/subscribers/on-os-finalizada-emitir-fatura.js'
import { ConfirmarPagamentoUseCase } from './application/use-cases/confirmar-pagamento.js'
import { ClienteOrcamentoGateway } from './application/gateways/cliente-orcamento-gateway.js'
import { DbClienteOrcamentoGateway } from '@/infra/gateways/db-cliente-orcamento-gateway.js'
import { ConfirmarPagamentoController } from './controllers/confirmar-pagamento-webhook.controller.js'

@Module({
  imports: [
    OsOrcamentoModule, // ➔ IMPORTANTE: Importa o módulo que provê o OrcamentoRepository
  ],
  controllers: [
    //Controllers
    ConfirmarPagamentoController,
  ],
  providers: [
    PrismaService,
    EmitirFaturaUseCase,
    ConfirmarPagamentoUseCase,

    //Subscribers
    OnOrdemServicoFinalizadaEmitirFatura,
    {
      provide: OrcamentoGateway, // Token da abstração
      useClass: DbOrcamentoGateway, // Implementação concreta
    },
    {
      provide: ClienteOrcamentoGateway, // Token da abstração
      useClass: DbClienteOrcamentoGateway, // Implementação concreta
    },
    {
      provide: FaturaRepository, // Token da abstração
      useClass: PrismaFaturaRepository, // Implementação concreta
    },
    // ... Use Cases do Faturamento que injetam OrcamentoGateway
  ],
  exports: [
    OrcamentoGateway, // Exporta se outros módulos precisarem usar
    ClienteOrcamentoGateway,
  ],
})
export class FaturamentoModule { }