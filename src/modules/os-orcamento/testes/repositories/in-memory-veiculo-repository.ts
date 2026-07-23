import { BuscarVeiculosParams, BuscarVeiculosResultado, VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"
import { Veiculo } from "@/modules/os-orcamento/domain/entities/veiculo.js"

export class InMemoryVeiculoRepository implements VeiculoRepository {
  public veiculos: Veiculo[] = []

  async create(veiculo: Veiculo): Promise<void> {
    this.veiculos.push(veiculo)
  }

  async save(veiculo: Veiculo): Promise<void> {
    const index = this.veiculos.findIndex(c => c.getId() === veiculo.getId())
    if (index !== -1) {
      this.veiculos[index] = veiculo
    }
  }

  async findById(id: string): Promise<Veiculo | null> {
    return this.veiculos.find(c => c.getId().toValue() === id) || null
  }

  async findByLicensePlate(placa: string): Promise<Veiculo | null> {
    return this.veiculos.find(c => c.getPlaca().getValor() === placa) || null
  }

  async delete(id: string): Promise<void> {
    this.veiculos = this.veiculos.filter(c => c.getId().toValue() !== id)
  }

  async list(): Promise<Veiculo[]> {
    return this.veiculos
  }

  async findMany({
    pagina,
    limite,
    status = 'ativos',
  }: BuscarVeiculosParams): Promise<BuscarVeiculosResultado> {
    // 1. Aplica os filtros na lista em memória
    const filteredClientes = this.veiculos.filter((item) => {
      // 🎯 Filtro por Status (baseado na existência da data deletadoEm)
      if (status === 'ativos' && item.getDeletadoEm() !== null) {
        return false
      }

      if (status === 'deletados' && item.getDeletadoEm() === null) {
        return false
      }

      return true
    })

    // 2. Ordena pelos mais recentes (simulando o orderBy do Prisma)
    const sortedClientes = filteredClientes.sort(
      (a, b) => b.getCriadoEm().getTime() - a.getCriadoEm().getTime()
    )

    // 3. Aplica a Paginação (equivalente ao skip e take)
    const startIndex = (pagina - 1) * limite
    const paginatedVeiculos = sortedClientes.slice(
      startIndex,
      startIndex + limite
    )

    // 4. Retorna no mesmo formato da interface
    return {
      veiculos: paginatedVeiculos,
      total: filteredClientes.length, // Total de itens mantidos APÓS os filtros, mas ANTES da paginação
      pagina,
      limite,
    }
  }
}
