import { RecepcionistaRepository } from "@/modules/os-orcamento/domain/repositories/recepcionista-repository.js"
import { Recepcionista } from "@/modules/os-orcamento/domain/entities/recepcionista.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryRecepcionistaRepository implements RecepcionistaRepository {
  public recepcionistas: Recepcionista[] = []

  async create(recepcionista: Recepcionista): Promise<void> {
    this.recepcionistas.push(recepcionista)

    await DomainEvents.dispatchEventsForAggregate(recepcionista)
  }

  async save(recepcionista: Recepcionista): Promise<void> {
    const index = this.recepcionistas.findIndex(c => c.getId() === recepcionista.getId())
    if (index !== -1) {
      this.recepcionistas[index] = recepcionista
    }

    await DomainEvents.dispatchEventsForAggregate(recepcionista)
  }

  async findById(id: string): Promise<Recepcionista | null> {
    return this.recepcionistas.find(c => c.getId().toValue() === id) || null
  }

  async findByEmail(email: string): Promise<Recepcionista | null> {
    return this.recepcionistas.find(c => c.getEmail().getValor() === email) || null
  }

  async findByCpf(cpf: string): Promise<Recepcionista | null> {
    return this.recepcionistas.find(c => c.getCpf().getValor() === cpf) || null
  }

  async delete(id: string): Promise<void> {
    this.recepcionistas = this.recepcionistas.filter(c => c.getId().toValue() !== id)
  }
}
