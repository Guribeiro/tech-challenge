// src/modules/autenticacao/tests/cryptography/fake-encrypter.ts
import { Encrypter, EncrypterPayload } from '../../domain/cryptography/encrypter.js'

export class FakeEncrypter implements Encrypter {
  /**
   * Simula a geração de um token transformando o objeto em uma string Base64.
   * Rápido, previsível e excelente para asserções em testes.
   */
  async encrypt(payload: EncrypterPayload): Promise<string> {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  /**
   * Reverte a string Base64 de volta para o formato de payload original.
   */
  async decrypt(token: string): Promise<EncrypterPayload | null> {
    try {
      const decodedString = Buffer.from(token, 'base64').toString('utf-8')
      const payload = JSON.parse(decodedString) as EncrypterPayload

      // Garante que o payload recuperado possui os campos obrigatórios do contrato
      if (!payload.sub || !payload.role) {
        return null
      }

      return payload
    } catch {
      // Se a string passada não for um Base64/JSON válido, simula a falha de validação do JWT
      return null
    }
  }
}