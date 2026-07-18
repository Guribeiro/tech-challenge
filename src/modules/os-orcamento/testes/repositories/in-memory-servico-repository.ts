import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js"
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js"

export class InMemoryServicoRepository implements ServicoRepository {
  private servicos: Servico[] = []

  async create(cliente: Servico): Promise<void> {
    this.servicos.push(cliente)
  }

  async save(cliente: Servico): Promise<void> {
    const index = this.servicos.findIndex(c => c.getId() === cliente.getId())
    if (index !== -1) {
      this.servicos[index] = cliente
    }
  }

  async findById(id: string): Promise<Servico | null> {
    return this.servicos.find(servico => servico.getId().toValue() === id) || null
  }

  async findManyByIds(ids: string[]): Promise<Servico[]> {
    return this.servicos.filter(servico =>
      ids.includes(servico.getId().toValue())
    )
  }
  async delete(id: string): Promise<void> {
    this.servicos = this.servicos.filter(c => c.getId().toValue() !== id)
  }
}
