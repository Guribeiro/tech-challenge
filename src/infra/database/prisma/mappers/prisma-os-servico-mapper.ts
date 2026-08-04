import { OrdemServicoServico as PrismaOrdemServicoServico } from '@/generated/prisma/client.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/ordem-servico-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaOrdemServicoServicoMapper {
  static toDomain(raw: PrismaOrdemServicoServico): OrdemServicoServico {
    return OrdemServicoServico.criar(
      {
        nome: raw.nome,
        categoria: raw.categoria,
        ordemServicoId: new UniqueEntityID(raw.ordemServicoId),
        servicoId: new UniqueEntityID(raw.servicoId),
        precoUnitario: raw.precoUnitario,
        descricao: raw.descricao ?? undefined,
        criadoEm: raw.criadoEm,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(servico: OrdemServicoServico) {
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