import { PaginationParams, PaginationResult, QueryStatus } from '@/core/repositories/pagination-params.js'
import { Produto, TipoProduto } from '@/modules/estoque/domain/entities/produto.js'

export type BuscarProdutosParams = PaginationParams & {
  tipo?: TipoProduto
  nome?: string
  status?: QueryStatus
}

export type BuscarProdutosResultado = PaginationResult & {
  produtos: Produto[]
}


export abstract class ProdutoRepository {
  abstract create(produto: Produto): Promise<void>
  abstract save(produto: Produto): Promise<void>
  abstract findById(id: string): Promise<Produto | null>
  abstract findByNome(nome: string): Promise<Produto | null>
  abstract delete(id: string): Promise<void>
  abstract list(): Promise<Produto[]>
  abstract findManyByIds(ids: string[]): Promise<Produto[]>
  abstract findMany(params: BuscarProdutosParams): Promise<BuscarProdutosResultado>
}