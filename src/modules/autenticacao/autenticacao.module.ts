import { Module } from '@nestjs/common'
import { CryptographyModule } from '@/infra/cryptography/cryptography.module.js'
import { DatabaseModule } from '@/infra/database/database.module.js'
import { PassportModule } from '@nestjs/passport'

import { AutenticarUseCase } from './application/use-cases/autenticar.js'
import { AutenticarController } from './controllers/autenticar.controller.js'
import { JwtStrategy } from '@/infra/auth/jwt.strategy.js'

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    PassportModule
  ],
  controllers: [AutenticarController],
  providers: [AutenticarUseCase, JwtStrategy],
  exports: [AutenticarUseCase],
})
export class AutenticacaoModule { }