import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

export type ListarVeiculosOutput = {
  veiculos: Veiculo[]
}

export class ListarVeiculosUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async executar(): Promise<ListarVeiculosOutput> {
    const veiculos = await this.veiculosRepository.list()
    return {
      veiculos
    }
  }
}
