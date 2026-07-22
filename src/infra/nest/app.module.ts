import { AutenticacaoModule } from '@/modules/autenticacao/autenticacao.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule acessível em todos os módulos sem precisar reimportar
    }),
    AutenticacaoModule
  ],
})
export class AppModule { }