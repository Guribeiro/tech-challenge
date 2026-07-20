import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"
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
}
