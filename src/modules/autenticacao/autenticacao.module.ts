import { Module } from '@nestjs/common'
import { CryptographyModule } from '@/infra/cryptography/cryptography.module.js'
import { DatabaseModule } from '@/infra/database/database.module.js'
import { PassportModule } from '@nestjs/passport'

import { CriarCredenciaisUseCase } from './application/use-cases/criar-credenciais.js'

import { AutenticarUseCase } from './application/use-cases/autenticar.js'
import { AutenticarController } from './controllers/autenticar.controller.js'
import { JwtStrategy } from '@/infra/auth/jwt.strategy.js'
import { OnMecanicoCriado } from './application/subscribers/on-mecanico-criado.js'
import { UsuariosRepository } from './domain/repositories/usuarios-repository.js'
import { PrismaUsuarioRepository } from '@/infra/database/prisma/repositories/prisma-usuario.repository.js'
import { OnClienteCriado } from './application/subscribers/on-cliente-criado.js'

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    PassportModule
  ],
  controllers: [AutenticarController],
  providers: [
    AutenticarUseCase,
    JwtStrategy,
    CriarCredenciaisUseCase,
    OnMecanicoCriado,
    OnClienteCriado,
    {
      provide: UsuariosRepository,
      useClass: PrismaUsuarioRepository
    }
  ],
  exports: [AutenticarUseCase, CriarCredenciaisUseCase],
})
export class AutenticacaoModule { }