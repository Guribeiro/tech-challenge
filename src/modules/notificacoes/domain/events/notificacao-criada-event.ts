import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Notificacao } from "../entities/notificacao.js"

export class NotificacaoCriadaEvent implements DomainEvent {
  public ocurredAt: Date
  public notificacao: Notificacao

  constructor(notificacao: Notificacao) {
    this.notificacao = notificacao
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.notificacao.getId()
  }
}