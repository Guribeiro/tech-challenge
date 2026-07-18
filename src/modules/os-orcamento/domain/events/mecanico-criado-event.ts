import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { DomainEvent } from "@/core/events/domain-event.js"
import { Mecanico } from "../entities/mecanico.js"

export class MecanicoCriadoEvent implements DomainEvent {
  public ocurredAt: Date
  public mecanico: Mecanico

  constructor(mecanico: Mecanico) {
    this.ocurredAt = new Date()
    this.mecanico = mecanico
  }

  getAggregateId(): UniqueEntityID {
    return this.mecanico.getId()
  }
}