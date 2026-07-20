import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

export type CriarVeiculoInput = {
  placa: string
  marca: string
  modelo: string
  ano: number
  cor?: string
  quilometragem?: number
  combustivel?: string
  observacoes?: string
}

export type CriarVeiculoOutput = {
  veiculo: Veiculo
}

export class CriarVeiculoUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async executar(input: CriarVeiculoInput): Promise<CriarVeiculoOutput> {

    const veiculoComMesmaPlaca = await this.veiculosRepository.findByLicensePlate(input.placa)

    if (veiculoComMesmaPlaca) {
      throw new Error('Placa já registrada em outro veiculo')
    }

    const veiculo = Veiculo.criar({
      placa: Placa.criar(input.placa),
      marca: input.marca,
      modelo: input.modelo,
      ano: input.ano,
      cor: input.cor,
      quilometragem: input.quilometragem,
      combustivel: input.combustivel,
      observacoes: input.observacoes,
    })

    this.veiculosRepository.save(veiculo)

    return {
      veiculo
    }
  }
}
