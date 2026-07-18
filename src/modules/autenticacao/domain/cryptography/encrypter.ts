// src/modules/autenticacao/domain/cryptography/encrypter.ts

export interface EncrypterPayload {
  sub: string
  role: 'MECANICO' | 'RECEPCAO' | 'ADMIN' | 'CLIENTE'
}

export interface Encrypter {
  encrypt(payload: EncrypterPayload): Promise<string>
  decrypt(token: string): Promise<EncrypterPayload | null>
}