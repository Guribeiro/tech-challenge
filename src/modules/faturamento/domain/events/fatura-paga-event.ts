import { DomainEvent } from "@/core/events/domain-event.js"
import { Fatura } from "../entities/fatura.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"

export class FaturaPagaEvent implements DomainEvent {
  public ocurredAt: Date
  public fatura: Fatura

  constructor(fatura: Fatura) {
    this.ocurredAt = new Date()
    this.fatura = fatura
  }

  public getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.fatura.getId())
  }
}