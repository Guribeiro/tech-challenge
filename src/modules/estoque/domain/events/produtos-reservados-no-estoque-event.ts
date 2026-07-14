import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"

export class ProdutosReservadosNoEstoqueEvent implements DomainEvent {
  public ocurredAt: Date
  public ordemServicoId: UniqueEntityID

  constructor(ordemServicoId: string) {
    this.ordemServicoId = new UniqueEntityID(ordemServicoId)
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.ordemServicoId
  }
}