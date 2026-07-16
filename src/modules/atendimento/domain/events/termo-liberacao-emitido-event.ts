import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { TermoLiberacao } from "../entities/termo-liberacao.js"

export class TermoLiberacaoEmitidoEvent implements DomainEvent {
  public ocurredAt: Date
  public termo: TermoLiberacao

  constructor(termo: TermoLiberacao) {
    this.termo = termo
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.termo.getId())
  }
}