import { Mecanico as PrismaMecanico } from '@/generated/prisma/client.js'
import { Mecanico } from '@/modules/os-orcamento/domain/entities/mecanico.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'

export class PrismaMecanicoMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaMecanico): Mecanico {
    return Mecanico.criar(
      {
        email: Email.criar(raw.email),
        nome: NomeCompleto.criar(raw.nome),
        cpf: Cpf.criar(raw.cpf),
        ativo: raw.ativo,
        especialidade: raw.especialidade ?? undefined,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(mecanico: Mecanico): PrismaMecanico {
    return {
      id: mecanico.getId().toValue(),
      email: mecanico.getEmail().getValor(),
      nome: mecanico.getNome().getValor(),
      ativo: mecanico.isAtivo(),
      cpf: mecanico.getCpf().getValor(),
      especialidade: mecanico.getEspecialidade() ?? null,
      criadoEm: mecanico.getCriadoEm(),
      atualizadoEm: mecanico.getAtualizadoEm() ?? null,
    }
  }
}