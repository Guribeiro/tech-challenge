import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
import { OrdemServico } from "../../domain/entities/ordem-servico.js"

export class InMemoryOrdemServicoRepository implements OrdemServicoRepository {
  private ordensServico: OrdemServico[] = []

  async create(ordemServico: OrdemServico): Promise<void> {
    this.ordensServico.push(ordemServico)
  }

  async save(ordemServico: OrdemServico): Promise<void> {
    const index = this.ordensServico.findIndex(os => os.getId() === ordemServico.getId())
    if (index !== -1) {
      this.ordensServico[index] = ordemServico
    }
  }

  async findById(id: string): Promise<OrdemServico | null> {
    return this.ordensServico.find(os => os.getId() === id) || null
  }

  async listServiceQueue(): Promise<OrdemServico[]> {
    return this.ordensServico.sort((a, b) => {
      const prioridadeA = a.getPrioridade().getPeso()
      const prioridadeB = b.getPrioridade().getPeso()
      return prioridadeB - prioridadeA
    })
  }
}
