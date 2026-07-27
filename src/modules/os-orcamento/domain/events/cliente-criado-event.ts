import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { DomainEvent } from "@/core/events/domain-event.js"
import { Cliente } from "../entities/cliente.js"

export class ClienteCriadoEvent implements DomainEvent {
  public ocurredAt: Date
  public cliente: Cliente

  constructor(cliente: Cliente) {
    this.ocurredAt = new Date()
    this.cliente = cliente
  }

  getAggregateId(): UniqueEntityID {
    return this.cliente.getId()
  }
}