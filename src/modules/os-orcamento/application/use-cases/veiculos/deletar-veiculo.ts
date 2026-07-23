import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { Injectable } from '@nestjs/common'

export type DeletarVeiculoInput = {
  id: string
}

export type DeletarVeiculoOutput = {
  veiculo: Veiculo
}

@Injectable()
export class DeletarVeiculoUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository,
  ) { }

  public async execute(input: DeletarVeiculoInput): Promise<DeletarVeiculoOutput> {
    const veiculo = await this.veiculosRepository.findById(input.id)

    if (!veiculo || veiculo.isDeletado()) {
      throw new Error('Veículo não encontrado.')
    }

    veiculo.deletar()

    await this.veiculosRepository.save(veiculo)

    return {
      veiculo
    }
  }
}
