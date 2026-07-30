import { Recepcionista as PrismaRecepcionista } from '@/generated/prisma/client.js'
import { Recepcionista } from '@/modules/os-orcamento/domain/entities/recepcionista.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'

export class PrismaRecepcionistaMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaRecepcionista): Recepcionista {
    return Recepcionista.criar(
      {
        email: Email.criar(raw.email),
        nome: NomeCompleto.criar(raw.nome),
        cpf: Cpf.criar(raw.cpf),
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
        desativadoEm: raw.desativadoEm ?? undefined
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(mecanico: Recepcionista): PrismaRecepcionista {
    return {
      id: mecanico.getId().toValue(),
      email: mecanico.getEmail().getValor(),
      nome: mecanico.getNome().getValor(),
      cpf: mecanico.getCpf().getValor(),
      criadoEm: mecanico.getCriadoEm(),
      atualizadoEm: mecanico.getAtualizadoEm() ?? null,
      desativadoEm: mecanico.getDesativadoEm() ?? null
    }
  }
}