import { DomainEvent } from "@/core/events/domain-event.js"
import { Usuario } from "../entities/usuario.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"

export class UsuarioCriadoEvent implements DomainEvent {
  public ocurredAt: Date
  public usuario: Usuario
  public senhaPlana?: string

  constructor(usuario: Usuario, senhaPlana?: string) {
    this.ocurredAt = new Date()
    this.usuario = usuario
    this.senhaPlana = senhaPlana
  }

  public getAggregateId(): UniqueEntityID {
    return this.usuario.getId()
  }
}