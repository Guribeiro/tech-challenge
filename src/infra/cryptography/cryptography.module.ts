import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { HashGenerator } from '@/modules/autenticacao/domain/cryptography/hash-generator.js'
import { Encrypter } from '@/modules/autenticacao/domain/cryptography/encrypter.js'

import { BcryptHasher } from './bcrypt-hasher.js'
import { JwtEncrypter } from './jwt-encrypter.js'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'sua-chave-secreta-default'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    {
      provide: HashGenerator,
      useClass: BcryptHasher,
    },
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
  ],
  exports: [HashGenerator, Encrypter],
})
export class CryptographyModule { }