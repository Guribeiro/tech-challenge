import { DomainEvent } from "../events/domain-event.js";
import { Entity } from "./entity.js";

export abstract class AggregateRoot<Props> extends Entity<Props> {
  // A "sacola" em memória que acumula os eventos disparados pelas regras de negócio
  private _domainEvents: DomainEvent[] = []

  // Getter público para que o Repositório consiga ler os eventos antes de dispará-los
  public get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  /**
   * Método protegido que as suas entidades (como Orcamento, OrdemServico) 
   * vão herdar e chamar internamente para registrar que algo importante aconteceu.
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  /**
   * Limpa a sacola de eventos. 
   * O Repositório chama este método LOGO APÓS disparar os eventos para o mundo externo,
   * evitando que o mesmo evento seja enviado duas vezes em operações futuras.
   */
  public clearEvents(): void {
    this._domainEvents = []
  }
}