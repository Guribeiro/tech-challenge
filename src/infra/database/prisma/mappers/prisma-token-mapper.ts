import { Token as PrismaToken, TokenType as PrismaTokenType } from '@/generated/prisma/client.js'
import { Token } from '@/modules/os-orcamento/domain/entities/token.js'
import { TokenType } from '@/modules/os-orcamento/domain/entities/value-objects/token-type.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaTokenMapper {
  static toDomain(raw: PrismaToken): Token {
    return Token.create(
      {
        token: raw.token,
        tipo: raw.tipo as TokenType,
        usado: raw.usado,
        expiraEm: raw.expiraEm,
        orcamentoId: raw.orcamentoId,
        criadoEm: raw.criadoEm,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(token: Token): PrismaToken {
    return {
      id: token.getId().toValue(),
      token: token.getToken(),
      tipo: token.getTipo() as PrismaTokenType,
      usado: token.getUsado(),
      expiraEm: token.getExpiraEm(),
      orcamentoId: token.getOrcamentoId() ?? null,
      criadoEm: token.getCriadoEm(),
    }
  }
}