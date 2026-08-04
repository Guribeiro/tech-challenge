import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Encrypter, EncrypterPayload } from '@/modules/autenticacao/domain/cryptography/encrypter.js'

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(private readonly jwtService: JwtService) { }

  async encrypt(payload: EncrypterPayload): Promise<string> {
    return this.jwtService.signAsync(payload)
  }

  async decrypt(token: string): Promise<EncrypterPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<EncrypterPayload>(token)
      return payload
    } catch {
      return null
    }
  }
}