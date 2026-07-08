import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'

export interface VeiculoRepository {
  create(veiculo: Veiculo): Promise<void>
  save(veiculo: Veiculo): Promise<void>
  findById(id: string): Promise<Veiculo | null>
  delete(id: string): Promise<void>
}