import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { Mecanico } from "@/modules/os-orcamento/domain/entities/mecanico.js"

export class InMemoryMecanicosRepository implements MecanicoRepository {
  private mecanicos: Mecanico[] = []

  async create(mecanico: Mecanico): Promise<void> {
    this.mecanicos.push(mecanico)
  }

  async save(mecanico: Mecanico): Promise<void> {
    const index = this.mecanicos.findIndex(c => c.getId() === mecanico.getId())
    if (index !== -1) {
      this.mecanicos[index] = mecanico
    }
  }

  async findById(id: string): Promise<Mecanico | null> {
    return this.mecanicos.find(c => c.getId() === id) || null
  }

  async delete(id: string): Promise<void> {
    this.mecanicos = this.mecanicos.filter(c => c.getId() !== id)
  }
}
