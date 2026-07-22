import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'

export abstract class VeiculoRepository {
  abstract create(veiculo: Veiculo): Promise<void>
  abstract save(veiculo: Veiculo): Promise<void>
  abstract findById(id: string): Promise<Veiculo | null>
  abstract findByLicensePlate(placa: string): Promise<Veiculo | null>
  abstract delete(id: string): Promise<void>
  abstract list(): Promise<Veiculo[]>
}