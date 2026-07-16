import { TermoLiberacao } from '../../domain/entities/termo-liberacao.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { TermoLiberacaoRepository } from '../../domain/repositories/termoRepository.js'

export class InMemoryTermoLiberacaoRepository implements TermoLiberacaoRepository {
  public items: TermoLiberacao[] = []

  public async findById(id: string): Promise<TermoLiberacao | null> {
    const termo = this.items.find((item) => item.getId() === id)
    return termo || null
  }

  public async findByOrdemServicoId(ordemServicoId: string): Promise<TermoLiberacao | null> {
    const termo = this.items.find((item) => item.getOrdemServicoId() === ordemServicoId)
    return termo || null
  }


  public async create(termo: TermoLiberacao): Promise<void> {
    this.items.push(termo)
    termo.domainEvents.forEach(event => DomainEvents.dispatch(event))
    termo.clearEvents()
  }


  public async save(termo: TermoLiberacao): Promise<void> {
    const index = this.items.findIndex((item) => item.getId() === termo.getId())

    if (index !== -1) {
      this.items[index] = termo
    }

    termo.domainEvents.forEach(event => DomainEvents.dispatch(event))
    termo.clearEvents()

  }
}