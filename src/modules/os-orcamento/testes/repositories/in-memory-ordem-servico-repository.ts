import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { OrdemServico } from "../../domain/entities/ordem-servico.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryOrdemServicoRepository implements OrdemServicoRepository {
  public items: OrdemServico[] = []

  async create(ordemServico: OrdemServico): Promise<void> {
    this.items.push(ordemServico)

    DomainEvents.dispatchEventsForAggregate(ordemServico)
    ordemServico.clearEvents()
  }

  async save(ordemServico: OrdemServico): Promise<void> {
    const index = this.items.findIndex(os => os.getId().equals(ordemServico.getId()))
    if (index !== -1) {
      this.items[index] = ordemServico
    }

    DomainEvents.dispatchEventsForAggregate(ordemServico)
    ordemServico.clearEvents()
  }

  async findById(id: string): Promise<OrdemServico | null> {
    return this.items.find(os => os.getId().toValue() === id) || null
  }

  async listServiceQueue(): Promise<OrdemServico[]> {
    return this.items.sort((a, b) => {
      const prioridadeA = a.getPrioridade().getPeso()
      const prioridadeB = b.getPrioridade().getPeso()
      return prioridadeB - prioridadeA
    })
  }

  async findManyReadyToInitialize(mecanicoId?: string): Promise<OrdemServico[]> {
    // 1. Filtra os registros com base nas regras de negócio
    const ordensFiltradas = this.items.filter(item => {
      const statusValido = item.getStatus() === 'PRONTA_PARA_INICIAR'

      if (mecanicoId) {
        const temMecanicoAtribuido = item.getMecanicoId()?.toValue() === mecanicoId
        return statusValido && temMecanicoAtribuido
      }

      return statusValido
    })

    return ordensFiltradas.sort((a, b) => {
      const pesoA = a.getPrioridade().getPeso()
      const pesoB = b.getPrioridade().getPeso()

      return pesoB - pesoA
    })
  }
}
