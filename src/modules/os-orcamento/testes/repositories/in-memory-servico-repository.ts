import { ServicoRepository, BuscarServicosParams, BuscarServicosResultado } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js"
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js"

export class InMemoryServicoRepository implements ServicoRepository {
  public servicos: Servico[] = []

  async create(servico: Servico): Promise<void> {
    this.servicos.push(servico)
  }

  async save(servico: Servico): Promise<void> {
    const index = this.servicos.findIndex(c => c.getId() === servico.getId())
    if (index !== -1) {
      this.servicos[index] = servico
    }
  }

  async findById(id: string): Promise<Servico | null> {
    return this.servicos.find(servico => servico.getId().toValue() === id) || null
  }

  async findByNome(nome: string): Promise<Servico | null> {
    return this.servicos.find(servico => servico.getNome() === nome) || null
  }

  async findManyByIds(ids: string[]): Promise<Servico[]> {
    return this.servicos.filter(servico =>
      ids.includes(servico.getId().toValue())
    )
  }
  async delete(id: string): Promise<void> {
    this.servicos = this.servicos.filter(c => c.getId().toValue() !== id)
  }

  async findMany({
    pagina,
    limite,
    status = 'ativos',
    nome,
  }: BuscarServicosParams): Promise<BuscarServicosResultado> {
    const filteredData = this.servicos.filter((item) => {
      if (status === 'ativos' && item.isDesativado()) {
        return false
      }

      if (status === 'deletados' && !item.isDesativado()) {
        return false
      }

      if (nome && !item.getNome().toLowerCase().includes(nome.toLowerCase())) {
        return false
      }

      return true
    })

    const sortedData = filteredData.toSorted(
      (a, b) => b.getCriadoEm().getTime() - a.getCriadoEm().getTime()
    )

    const startIndex = (pagina - 1) * limite
    const paginatedData = sortedData.slice(
      startIndex,
      startIndex + limite
    )

    return {
      servicos: paginatedData,
      total: filteredData.length,
      pagina,
      limite,
    }
  }
}
