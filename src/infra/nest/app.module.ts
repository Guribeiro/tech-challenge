import { AutenticacaoModule } from '@/modules/autenticacao/autenticacao.module.js';
import { EstoqueModule } from '@/modules/estoque/estoque.module.js';
import { FaturamentoModule } from '@/modules/faturamento/faturamento.module.js';
import { NotificacoesModule } from '@/modules/notificacoes/notificacoes.module.js';
import { OsOrcamentoModule } from '@/modules/os-orcamento/os-orcamento.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule acessível em todos os módulos sem precisar reimportar
    }),
    AutenticacaoModule,
    OsOrcamentoModule,
    EstoqueModule,
    NotificacoesModule,
    FaturamentoModule
  ],
})
export class AppModule { }