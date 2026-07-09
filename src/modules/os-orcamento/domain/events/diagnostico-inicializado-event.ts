import { DomainEvent } from '@/core/events/domain-event.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class DiagnosticoInicializadoEvent implements DomainEvent {
  public ocurredAt: Date

  // Guardamos o ID da OS e o ID do Cliente para quem precisa enviar a notificação
  constructor(
    public readonly ordemServicoId: UniqueEntityID,
    public readonly clienteId: UniqueEntityID
  ) {
    this.ocurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityID {
    return this.ordemServicoId
  }
}