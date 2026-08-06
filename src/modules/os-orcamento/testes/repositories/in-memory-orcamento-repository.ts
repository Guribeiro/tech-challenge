import { DomainEvents } from "@/core/events/domain-events.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"

export class InMemoryOrcamentoRepository implements OrcamentoRepository {
  // Simula a tabela do banco de dados em memória
  public items: Orcamento[] = []

  async findById(id: string): Promise<Orcamento | null> {
    const orcamento = this.items.find(item => item.getId().toValue() === id)

    if (!orcamento) return null
    return orcamento
  }

  async findByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null> {
    const orcamento = this.items.find(item => item.getOrdemServicoId().toValue() === ordemServicoId)

    if (!orcamento) return null
    return orcamento
  }

  async create(orcamento: Orcamento): Promise<void> {
    this.items.push(orcamento)

    // Despacha os eventos caso o orçamento já nasça disparando algo (opcional)
    await DomainEvents.dispatchEventsForAggregate(orcamento)
  }

  async save(orcamento: Orcamento): Promise<void> {
    const itemIndex = this.items.findIndex(item => item.equals(orcamento))

    if (itemIndex >= 0) {
      this.items[itemIndex] = orcamento
    } else {
      this.items.push(orcamento)
    }
    await DomainEvents.dispatchEventsForAggregate(orcamento)
  }
}