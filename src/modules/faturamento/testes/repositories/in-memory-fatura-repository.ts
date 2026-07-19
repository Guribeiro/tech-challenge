import { FaturaRepository } from "@/modules/faturamento/domain/repositories/faturas-repository.js"
import { Fatura } from "@/modules/faturamento/domain/entities/fatura.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryFaturasRepository implements FaturaRepository {
  private faturas: Fatura[] = []

  async create(fatura: Fatura): Promise<void> {
    this.faturas.push(fatura)

    fatura.domainEvents.forEach(event => DomainEvents.dispatch(event))
    fatura.clearEvents()
  }

  async save(fatura: Fatura): Promise<void> {
    const index = this.faturas.findIndex(c => c.getId() === fatura.getId())
    if (index !== -1) {
      this.faturas[index] = fatura
    }

    fatura.domainEvents.forEach(event => DomainEvents.dispatch(event))
    fatura.clearEvents()
  }

  async findById(id: string): Promise<Fatura | null> {
    return this.faturas.find(c => c.getId().toValue() === id) || null
  }

  async delete(id: string): Promise<void> {
    this.faturas = this.faturas.filter(c => c.getId().toValue() !== id)
  }
}
