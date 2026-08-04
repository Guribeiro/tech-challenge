import { Servico as PrismaServico } from '@/generated/prisma/client.js'
import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaServicoMapper {
  static toDomain(raw: PrismaServico): Servico {
    return Servico.criar(
      {
        nome: raw.nome,
        categoria: raw.categoria,
        valorReferencia: raw.valorReferencia,
        descricao: raw.descricao ?? undefined,
        desativadoEm: raw.desativadoEm ?? undefined,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toPrisma(servico: Servico): PrismaServico {
    return {
      id: servico.getId().toValue(),
      nome: servico.getNome(),
      categoria: servico.getCategoria(),
      descricao: servico.getDescricao() ?? null,
      valorReferencia: servico.getValorReferencia(),
      criadoEm: servico.getCriadoEm(),
      atualizadoEm: servico.getAtualizadoEm() ?? null,
      desativadoEm: servico.getDesativadoEm() ?? null,
    }
  }
}