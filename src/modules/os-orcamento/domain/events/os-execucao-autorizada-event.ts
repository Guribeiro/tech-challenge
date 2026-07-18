import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { OrdemServico } from "../entities/ordem-servico.js"

export class OSExecucaoAutorizadaEvent implements DomainEvent {
  public ocurredAt: Date
  public ordemServico: OrdemServico

  constructor(ordemServico: OrdemServico) {
    this.ordemServico = ordemServico
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.ordemServico.getId()
  }
}