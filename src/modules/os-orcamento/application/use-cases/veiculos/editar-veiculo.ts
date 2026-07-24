import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { Injectable } from '@nestjs/common'

export type EditarVeiculoInput = {
  id: string
  placa?: string
  marca?: string
  modelo?: string
  ano?: number
  cor?: string
  quilometragem?: number
  combustivel?: string
  observacoes?: string
}

export type EditarVeiculoOutput = {
  veiculo: Veiculo
}

@Injectable()
export class EditarVeiculoUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async execute(input: EditarVeiculoInput): Promise<EditarVeiculoOutput> {
    const veiculo = await this.veiculosRepository.findById(input.id)

    if (!veiculo) {
      throw new Error('Veículo não encontrado.')
    }


    let novaPlaca = veiculo.getPlaca()
    if (input.placa && input.placa !== veiculo.getPlaca().getValor()) {
      const veiculoComMesmaPlaca = await this.veiculosRepository.findByLicensePlate(input.placa)

      if (veiculoComMesmaPlaca && !veiculoComMesmaPlaca.getId().equals(veiculo.getId())) {
        throw new Error('Placa já registrada em outro veículo.')
      }

      novaPlaca = Placa.criar(input.placa)
    }

    veiculo.atualizar({
      placa: novaPlaca,
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      cor: input.cor,
      quilometragem: input.quilometragem,
      combustivel: input.combustivel,
      observacoes: input.observacoes,
    })

    await this.veiculosRepository.save(veiculo)

    return {
      veiculo
    }
  }
}