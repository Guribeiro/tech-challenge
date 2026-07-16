import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Fatura } from "../entities/fatura.js"

export class FaturaEmitidaEvent implements DomainEvent {
  public ocurredAt: Date
  public fatura: Fatura

  constructor(fatura: Fatura) {
    this.fatura = fatura
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.fatura.getId())
  }
}