
import { Either, left, right } from '@/core/either.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { Orcamento } from '../entities/orcamento.js'
import { OrcamentoServico } from '../entities/orcamento-servico.js'
import { OrcamentoComponente } from '../entities/orcamento-componente.js'
import { ServicoRepository } from '../repositories/servicos-repository.js'
import { ProdutoRepository } from '@/modules/estoque/domain/repositories/produtos-repository.js'
import { Injectable } from '@nestjs/common'

export interface ServicoItemInput {
  id?: string
  servicoId: string
}

export interface ComponenteItemInput {
  id?: string
  produtoId: string
  quantidade: number
}
@Injectable()
export class RenegociarOrcamentoService {
  constructor(
    private readonly servicoRepository: ServicoRepository,
    private readonly produtoRepository: ProdutoRepository,
  ) { }

  public async processarServicos(
    orcamento: Orcamento,
    servicos?: ServicoItemInput[],
  ): Promise<Either<RecursoNaoEncontradoError, OrcamentoServico[]>> {
    if (!servicos?.length) return right([])

    const existentesMap = new Map(
      orcamento.getServicos().getItems().map((s) => [s.getId().toValue(), s]),
    )
    const novosIds = [...new Set(servicos.filter((s) => !s.id).map((s) => s.servicoId))]

    const catalogo = novosIds.length > 0
      ? await this.servicoRepository.findManyByIds(novosIds)
      : []
    const catalogoMap = new Map(catalogo.map((s) => [s.getId().toValue(), s]))

    const servicosFinais: OrcamentoServico[] = []

    for (const item of servicos) {
      const existente = item.id ? existentesMap.get(item.id) : null
      if (existente) {
        servicosFinais.push(existente)
        continue
      }

      const catalogoItem = catalogoMap.get(item.servicoId)
      if (!catalogoItem) {
        return left(new RecursoNaoEncontradoError('Serviço'))
      }

      servicosFinais.push(
        OrcamentoServico.criar({
          orcamentoId: orcamento.getId(),
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
    orcamento: Orcamento,
    componentes?: ComponenteItemInput[],
  ): Promise<Either<RecursoNaoEncontradoError, OrcamentoComponente[]>> {
    if (!componentes?.length) return right([])

    const existentesMap = new Map(
      orcamento.getComponentes().getItems().map((c) => [c.getId().toValue(), c]),
    )
    const novosIds = [...new Set(componentes.filter((c) => !c.id).map((c) => c.produtoId))]

    const catalogo = novosIds.length > 0
      ? await this.produtoRepository.findManyByIds(novosIds)
      : []
    const catalogoMap = new Map(catalogo.map((p) => [p.getId().toValue(), p]))

    const componentesFinais: OrcamentoComponente[] = []

    for (const item of componentes) {
      const existente = item.id ? existentesMap.get(item.id) : null
      if (existente) {
        existente.setQuantidade(item.quantidade)
        componentesFinais.push(existente)
        continue
      }

      const produto = catalogoMap.get(item.produtoId)
      if (!produto) {
        return left(new RecursoNaoEncontradoError('Produto'))
      }

      componentesFinais.push(
        OrcamentoComponente.criar({
          orcamentoId: orcamento.getId(),
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