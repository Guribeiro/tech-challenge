import { Notificacao } from "../../domain/entities/notificacao.js";
import { NotificacaosRepository } from "../../domain/repositories/notificacao-repository.js";
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryNotificacaoRepository implements NotificacaosRepository {
  public notificacoes: Notificacao[] = []

  async create(notificacao: Notificacao): Promise<void> {
    this.notificacoes.push(notificacao)

    notificacao.domainEvents.forEach(event => DomainEvents.dispatch(event))
    notificacao.clearEvents()
  }

  async save(notificacao: Notificacao): Promise<void> {
    const index = this.notificacoes.findIndex(c => c.getId() === notificacao.getId())
    if (index !== -1) {
      this.notificacoes[index] = notificacao
    }

    notificacao.domainEvents.forEach(event => DomainEvents.dispatch(event))
    notificacao.clearEvents()
  }

  async findById(id: string): Promise<Notificacao | null> {
    return this.notificacoes.find(c => c.getId().toValue() === id) || null
  }

  async findByDestinatarioId(destinatarioId: string): Promise<Notificacao | null> {
    return this.notificacoes.find(c => c.getDestinatarioId().toValue() === destinatarioId) || null
  }
}