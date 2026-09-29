import { Token } from '../../domain/entities/token.js'

export abstract class TokenRepository {
  abstract create(token: Token): Promise<void>
  abstract findByToken(token: string): Promise<Token | null>
  abstract save(token: Token): Promise<void>
}