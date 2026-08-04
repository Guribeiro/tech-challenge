import { OrdemServicoComponente as PrismaOrdemServicoComponente } from '@/generated/prisma/client.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/ordem-servico-componente.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaOrdemServicoComponenteMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaOrdemServicoComponente): OrdemServicoComponente {
    return OrdemServicoComponente.criar(
      {
        ordemServicoId: new UniqueEntityID(raw.ordemServicoId),
        produtoId: new UniqueEntityID(raw.produtoId),
        nome: raw.nome,
        tipo: raw.tipo,
        marca: raw.marca ?? undefined,
        codigoSKU: raw.codigoSKU ?? undefined,
        codigoFabricante: raw.codigoFabricante ?? undefined,
        descricao: raw.descricao ?? undefined,
        quantidade: raw.quantidade,
        precoCusto: raw.precoCusto,
        precoUnitario: raw.precoUnitario,
        unidadeMedida: raw.unidadeMedida ?? undefined,
        criadoEm: raw.criadoEm,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(componente: OrdemServicoComponente) {
    return {
      id: componente.getId().toValue(),
      produtoId: componente.getProdutoId().toValue(),
      nome: componente.getNome(),
      tipo: componente.getTipo(),
      marca: componente.getMarca() ?? null,
      codigoSKU: componente.getCodigoSKU() ?? null,
      codigoFabricante: componente.getCodigoFabricante() ?? null,
      descricao: componente.getDescricao() ?? null,
      precoCusto: componente.getPrecoCusto(),
      precoUnitario: componente.getPrecoUnitario(),
      unidadeMedida: componente.getUnidadeMedida() ?? null,
      quantidade: componente.getQuantidade(),
      criadoEm: componente.getCriadoEm(),
    }
  }
}