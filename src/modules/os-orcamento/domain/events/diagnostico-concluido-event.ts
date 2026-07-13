import { DomainEvent } from "@/core/events/domain-event.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { OrdemServico } from "../entities/ordem-servico.js" // Ajuste o caminho da sua entidade OS

export class DiagnosticoConcluidoEvent implements DomainEvent {
  public ocurredAt: Date
  public ordemServico: OrdemServico

  constructor(ordemServico: OrdemServico) {
    this.ordemServico = ordemServico
    this.ocurredAt = new Date()
  }

  /**
   * Retorna o ID do Agregado Raiz dono deste evento.
   * Exigido pela interface DomainEvent do seu core.
   */
  public getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.ordemServico.getId())
  }
}