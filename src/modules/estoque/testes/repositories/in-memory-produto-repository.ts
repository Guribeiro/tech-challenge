import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js"
import { Produto } from "@/modules/estoque/domain/entities/produto.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryProdutoRepository implements ProdutoRepository {
  private produtos: Produto[] = []

  async create(produto: Produto): Promise<void> {
    this.produtos.push(produto)
  }

  async save(produto: Produto): Promise<void> {
    const index = this.produtos.findIndex(c => c.getId() === produto.getId())
    if (index !== -1) {
      this.produtos[index] = produto
    }

    produto.domainEvents.forEach(event => DomainEvents.dispatch(event))

    produto.clearEvents()
  }

  async findById(id: string): Promise<Produto | null> {
    return this.produtos.find(c => c.getId() === id) || null
  }

  async findByNome(nome: string): Promise<Produto | null> {
    return this.produtos.find(c => c.getNome() === nome) || null
  }

  async delete(id: string): Promise<void> {
    this.produtos = this.produtos.filter(c => c.getId() !== id)
  }

  async list(): Promise<Produto[]> {
    return this.produtos
  }

  async findManyByIds(ids: string[]): Promise<Produto[]> {
    return this.produtos.filter(produto =>
      ids.includes(produto.getId())
    )
  }
}
