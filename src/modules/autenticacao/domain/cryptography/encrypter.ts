// src/modules/autenticacao/domain/cryptography/encrypter.ts

export interface EncrypterPayload {
  sub: string
  role: 'MECANICO' | 'RECEPCAO' | 'ADMIN' | 'CLIENTE'
}

export abstract class Encrypter {
  abstract encrypt(payload: EncrypterPayload): Promise<string>
  abstract decrypt(token: string): Promise<EncrypterPayload | null>
}