import { Usuario as PrismaUsuario } from '@/generated/prisma/client.js'
import { Usuario } from '@/modules/autenticacao/domain/entities/usuario.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaUsuarioMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaUsuario): Usuario {
    return Usuario.create(
      {
        email: Email.criar(raw.email),
        role: raw.role,
        senhaHash: raw.senhaHash,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(usuario: Usuario): PrismaUsuario {
    return {
      id: usuario.getId().toValue(),
      email: usuario.getEmail().getValor(),
      role: usuario.getRole(),
      senhaHash: usuario.getSenhaHash(),
      criadoEm: usuario.getCriadoEm(),
      atualizadoEm: usuario.getAtualizadoEm() ?? null,
    }
  }
}