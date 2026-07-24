import { Produto as PrismaProduto } from '@/generated/prisma/client.js'
import { Produto } from '@/modules/estoque/domain/entities/produto.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaProdutoMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaProduto): Produto {
    return Produto.criar(
      {
        nome: raw.nome,
        tipo: raw.tipo,
        marca: raw.marca ?? undefined,
        descricao: raw.descricao ?? undefined,
        codigoSKU: raw.codigoSKU ?? undefined,
        codigoFabricante: raw.codigoFabricante ?? undefined,
        precoUnitario: raw.precoUnitario,
        precoCusto: raw.precoCusto,
        quantidadeEstoque: raw.quantidadeEstoque,
        estoqueMinimo: raw.estoqueMinimo ?? undefined,
        estoqueMaximo: raw.estoqueMaximo ?? undefined,
        unidadeMedida: raw.unidadeMedida ?? undefined,
        localizacao: raw.localizacao ?? undefined,
        quantidadeReservada: raw.quantidadeReservada ?? undefined,
        desativadoEm: raw.desativadoEm ?? undefined,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(produto: Produto): PrismaProduto {
    return {
      id: produto.getId().toValue(),
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca() ?? null,
      descricao: produto.getDescricao() ?? null,
      codigoSKU: produto.getCodigoSKU() ?? null,
      codigoFabricante: produto.getCodigoFabricante() ?? null,
      precoUnitario: produto.getPrecoUnitario(),
      precoCusto: produto.getPrecoCusto(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      quantidadeReservada: produto.getQuantidadeReservada() ?? 0,
      estoqueMinimo: produto.getEstoqueMinimo() ?? null,
      estoqueMaximo: produto.getEstoqueMaximo() ?? null,
      unidadeMedida: produto.getUnidadeMedida() ?? null,
      localizacao: produto.getLocalizacao() ?? null,
      criadoEm: produto.getCriadoEm(),
      atualizadoEm: produto.getAtualizadoEm() ?? null,
      desativadoEm: produto.getDesativadoEm() ?? null,
    }
  }
}