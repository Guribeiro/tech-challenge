import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { Mecanico } from "@/modules/os-orcamento/domain/entities/mecanico.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryMecanicosRepository implements MecanicoRepository {
  public mecanicos: Mecanico[] = []

  async create(mecanico: Mecanico): Promise<void> {
    this.mecanicos.push(mecanico)

    await DomainEvents.dispatchEventsForAggregate(mecanico)
  }

  async save(mecanico: Mecanico): Promise<void> {
    const index = this.mecanicos.findIndex(c => c.getId() === mecanico.getId())
    if (index !== -1) {
      this.mecanicos[index] = mecanico
    }

    await DomainEvents.dispatchEventsForAggregate(mecanico)
  }

  async findById(id: string): Promise<Mecanico | null> {
    return this.mecanicos.find(c => c.getId().toValue() === id) || null
  }

  async findByEmail(email: string): Promise<Mecanico | null> {
    return this.mecanicos.find(c => c.getEmail().getValor() === email) || null
  }

  async findByCpf(cpf: string): Promise<Mecanico | null> {
    return this.mecanicos.find(c => c.getCpf().getValor() === cpf) || null
  }

  async delete(id: string): Promise<void> {
    this.mecanicos = this.mecanicos.filter(c => c.getId().toValue() !== id)
  }
}
