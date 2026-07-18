// src/modules/autenticacao/tests/cryptography/fake-hasher.ts
import { HashGenerator } from '../../domain/cryptography/hash-generator.js'

export class FakeHasher implements HashGenerator {
  /**
   * Simula a criptografia invertendo a string de trás para frente.
   * É instantâneo, determinístico e visualmente fácil de identificar em logs de teste.
   */
  async generateHash(payload: string): Promise<string> {
    return payload.split('').reverse().join('')
  }

  /**
   * Compara a string plana aplicando a mesma inversão e checando se é idêntica ao hash salvo.
   */
  async compareHash(payload: string, hashed: string): Promise<boolean> {
    const hashedPayload = await this.generateHash(payload)
    return hashedPayload === hashed
  }
}