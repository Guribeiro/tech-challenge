import { Produto } from '@/modules/estoque/domain/entities/produto.js'

export interface ProdutoRepository {
  create(cliente: Produto): Promise<void>
  save(cliente: Produto): Promise<void>
  findById(id: string): Promise<Produto | null>
  findByNome(nome: string): Promise<Produto | null>
  delete(id: string): Promise<void>
  list(): Promise<Produto[]>
  findManyByIds(ids: string[]): Promise<Produto[]>
}