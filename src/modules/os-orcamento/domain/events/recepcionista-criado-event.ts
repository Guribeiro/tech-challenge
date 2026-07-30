import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { DomainEvent } from "@/core/events/domain-event.js"
import { Recepcionista } from "../entities/recepcionista.js"

export class RecepcionistaCriadoEvent implements DomainEvent {
  public ocurredAt: Date
  public recepcionista: Recepcionista

  constructor(cliente: Recepcionista) {
    this.ocurredAt = new Date()
    this.recepcionista = cliente
  }

  getAggregateId(): UniqueEntityID {
    return this.recepcionista.getId()
  }
}