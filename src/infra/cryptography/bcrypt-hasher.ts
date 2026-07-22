import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { HashGenerator } from '@/modules/autenticacao/domain/cryptography/hash-generator.js'

@Injectable()
export class BcryptHasher implements HashGenerator {
  private HASH_SALT_LENGTH = 8

  async generateHash(payload: string): Promise<string> {
    return hash(payload, this.HASH_SALT_LENGTH)
  }

  async compareHash(plainText: string, hashedText: string): Promise<boolean> {
    return compare(plainText, hashedText)
  }
}