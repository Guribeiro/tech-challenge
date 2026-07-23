import { Cliente as PrismaCliente } from '@/generated/prisma/client.js'
import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'

export class PrismaClienteMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaCliente): Cliente {
    return Cliente.criar(
      {
        email: Email.criar(raw.email),
        nome: NomeCompleto.criar(raw.nome),
        telefone: Telefone.criar(raw.telefone),
        cpf: Cpf.criar(raw.cpf),
        tipo: raw.tipo,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
        deletadoEm: raw.deletadoEm ?? undefined
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(cliente: Cliente): PrismaCliente {
    return {
      id: cliente.getId().toValue(),
      email: cliente.getEmail().getValor(),
      nome: cliente.getNome().getValor(),
      telefone: cliente.getTelefone().getValor(),
      cpf: cliente.getCpf().getValor(),
      tipo: cliente.getTipo(),
      criadoEm: cliente.getCriadoEm(),
      atualizadoEm: cliente.getAtualizadoEm() ?? null,
      deletadoEm: cliente.getDeletadoEm() ?? null
    }
  }
}