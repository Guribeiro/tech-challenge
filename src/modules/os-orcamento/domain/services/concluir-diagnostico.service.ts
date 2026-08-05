import { Either, left, right } from '@/core/either.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { ServicoRepository } from '../repositories/servicos-repository.js'
import { ProdutoRepository } from '@/modules/estoque/domain/repositories/produtos-repository.js'
import { OrdemServico } from '../entities/ordem-servico.js'
import { OrdemServicoServico } from '../entities/ordem-servico-servico.js'
import { OrdemServicoComponente } from '../entities/ordem-servico-componente.js'
import { Injectable } from '@nestjs/common'

export interface ServicoInputItem {
  id?: string
  servicoId: string
}

export interface ComponenteInputItem {
  id?: string
  produtoId: string
  quantidade: number
}
@Injectable()
export class ConcluirDiagnosticoService {
  constructor(
    private readonly servicoRepository: ServicoRepository,
    private readonly produtoRepository: ProdutoRepository,
  ) { }

  public async processarServicos(
    ordemServico: OrdemServico,
    servicosInput?: ServicoInputItem[],
  ): Promise<Either<RecursoNaoEncontradoError, OrdemServicoServico[]>> {
    if (!servicosInput) {
      return right(ordemServico.getServicos().getItems())
    }

    const existentesMap = new Map(
      ordemServico.getServicos().getItems().map((s) => [s.getId().toValue(), s]),
    )
    const novosIds = [...new Set(
      servicosInput
        .filter((s) => !s.id || !existentesMap.has(s.id))
        .map((s) => s.servicoId)
    )]

    const catalogo = novosIds.length > 0
      ? await this.servicoRepository.findManyByIds(novosIds)
      : []
    const catalogoMap = new Map(catalogo.map((s) => [s.getId().toValue(), s]))

    const servicosFinais: OrdemServicoServico[] = []

    for (const item of servicosInput) {
      const existente = item.id ? existentesMap.get(item.id) : null
      if (existente) {
        servicosFinais.push(existente)
        continue
      }

      const catalogoItem = catalogoMap.get(item.servicoId)
      if (!catalogoItem) {
        return left(new RecursoNaoEncontradoError(`Serviço com ID ${item.servicoId}`))
      }

      servicosFinais.push(
        OrdemServicoServico.criar({
          ordemServicoId: ordemServico.getId(),
          servicoId: catalogoItem.getId(),
          precoUnitario: catalogoItem.getValorReferencia(),
          categoria: catalogoItem.getCategoria(),
          nome: catalogoItem.getNome(),
        }),
      )
    }

    return right(servicosFinais)
  }

  public async processarComponentes(
    ordemServico: OrdemServico,
    componentesInput?: ComponenteInputItem[],
  ): Promise<Either<RecursoNaoEncontradoError, OrdemServicoComponente[]>> {
    if (!componentesInput) {
      return right(ordemServico.getComponentes().getItems())
    }

    const existentesMap = new Map(
      ordemServico.getComponentes().getItems().map((c) => [c.getId().toValue(), c]),
    )
    const novosIds = [...new Set(
      componentesInput
        .filter((c) => !c.id || !existentesMap.has(c.id))
        .map((c) => c.produtoId)
    )]

    const catalogo = novosIds.length > 0
      ? await this.produtoRepository.findManyByIds(novosIds)
      : []
    const catalogoMap = new Map(catalogo.map((p) => [p.getId().toValue(), p]))

    const componentesFinais: OrdemServicoComponente[] = []

    for (const item of componentesInput) {
      const existente = item.id ? existentesMap.get(item.id) : null
      if (existente) {
        existente.setQuantidade(item.quantidade)
        componentesFinais.push(existente)
        continue
      }

      const produto = catalogoMap.get(item.produtoId)
      if (!produto) {
        return left(new RecursoNaoEncontradoError(`Produto com ID ${item.produtoId}`))
      }

      componentesFinais.push(
        OrdemServicoComponente.criar({
          ordemServicoId: ordemServico.getId(),
          produtoId: produto.getId(),
          nome: produto.getNome(),
          tipo: produto.getTipo(),
          marca: produto.getMarca(),
          descricao: produto.getNome(),
          codigoSKU: produto.getCodigoSKU(),
          codigoFabricante: produto.getCodigoFabricante(),
          unidadeMedida: produto.getUnidadeMedida(),
          quantidade: item.quantidade,
          precoUnitario: produto.getPrecoUnitario(),
          precoCusto: produto.getPrecoCusto(),
        }),
      )
    }

    return right(componentesFinais)
  }
}