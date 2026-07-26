import { OrcamentoServico as PrismaOrcamentoServico } from '@/generated/prisma/client.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrcamentoServico } from '@/modules/os-orcamento/domain/entities/orcamento-servico.js'

export class PrismaOrcamentoServicoMapper {
  static toDomain(raw: PrismaOrcamentoServico): OrcamentoServico {
    return OrcamentoServico.criar(
      {
        categoria: raw.categoria,
        nome: raw.nome,
        orcamentoId: new UniqueEntityID(raw.orcamentoId),
        servicoId: new UniqueEntityID(raw.servicoId),
        precoUnitario: raw.precoUnitario,
        descricao: raw.descricao ?? undefined,
        criadoEm: raw.criadoEm,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toPrisma(servico: OrcamentoServico) {
    return {
      id: servico.getId().toValue(),
      nome: servico.getNome(),
      categoria: servico.getCategoria(),
      criadoEm: servico.getCriadoEm(),
      precoUnitario: servico.getPrecoUnitario(),
      descricao: servico.getDescricao() ?? null,
      servicoId: servico.getServicoId().toValue()
    }
  }
}