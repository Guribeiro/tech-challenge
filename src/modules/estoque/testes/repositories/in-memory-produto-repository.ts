import { BuscarProdutosParams, BuscarProdutosResultado, ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js"
import { Produto } from "@/modules/estoque/domain/entities/produto.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryProdutoRepository implements ProdutoRepository {
  public produtos: Produto[] = []

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
    return this.produtos.find(c => c.getId().toValue() === id) || null
  }

  async findByNome(nome: string): Promise<Produto | null> {
    return this.produtos.find(c => c.getNome() === nome) || null
  }

  async delete(id: string): Promise<void> {
    this.produtos = this.produtos.filter(c => c.getId().toValue() !== id)
  }

  async list(): Promise<Produto[]> {
    return this.produtos
  }

  async findManyByIds(ids: string[]): Promise<Produto[]> {
    return this.produtos.filter(produto =>
      ids.includes(produto.getId().toValue())
    )
  }


  async findMany({
    pagina,
    limite,
    status = 'ativos',
    nome,
  }: BuscarProdutosParams): Promise<BuscarProdutosResultado> {
    // 1. Aplica os filtros na lista em memória
    const filteredData = this.produtos.filter((item) => {
      if (status === 'ativos' && item.getDesativadoEm() !== null) {
        return false
      }

      if (status === 'deletados' && item.getDesativadoEm() === null) {
        return false
      }

      if (nome && !item.getNome().toLowerCase().includes(nome.toLowerCase())) {
        return false
      }

      return true
    })

    // 2. Ordena pelos mais recentes (simulando o orderBy do Prisma)
    const sortedData = filteredData.sort(
      (a, b) => b.getCriadoEm().getTime() - a.getCriadoEm().getTime()
    )

    const startIndex = (pagina - 1) * limite
    const paginatedData = sortedData.slice(
      startIndex,
      startIndex + limite
    )

    return {
      produtos: paginatedData,
      total: filteredData.length,
      pagina,
      limite,
    }
  }
}
