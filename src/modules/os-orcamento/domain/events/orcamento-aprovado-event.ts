import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Orcamento } from "../entities/orcamento.js"

export class OrcamentoAprovadoEvent implements DomainEvent {
  public ocurredAt: Date
  public orcamento: Orcamento

  constructor(orcamento: Orcamento) {
    this.orcamento = orcamento
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.orcamento.getId()
  }
}