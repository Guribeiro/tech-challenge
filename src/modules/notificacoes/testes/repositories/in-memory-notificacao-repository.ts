import { Notificacao } from "../../domain/entities/notificacao.js";
import { BuscarNotificacoesParams, BuscarNotificacoesResultado, NotificacaoRepository } from "../../domain/repositories/notificacao-repository.js";
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryNotificacaoRepository implements NotificacaoRepository {
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

  async findMany({
    destinatarioId,
    pagina,
    limite,
    status = 'nao_lidas',
  }: BuscarNotificacoesParams): Promise<BuscarNotificacoesResultado> {
    const filteredNotificacoes = this.notificacoes.filter((item) => {
      if (item.getDestinatarioId().toValue() !== destinatarioId) {
        return false
      }

      const isLida = item.getLidaEm() != null

      // 🎯 Filtro por Status
      if (status === 'lidas') {
        return isLida
      }

      if (status === 'nao_lidas') {
        return !isLida
      }

      return true
    })

    const sortedNotificacoes = filteredNotificacoes.toSorted(
      (a, b) => b.getCriadaEm().getTime() - a.getCriadaEm().getTime()
    )

    const startIndex = (pagina - 1) * limite
    const paginatedNotificacoes = sortedNotificacoes.slice(
      startIndex,
      startIndex + limite
    )

    return {
      notificacoes: paginatedNotificacoes,
      total: filteredNotificacoes.length,
      pagina,
      limite,
    }
  }
}