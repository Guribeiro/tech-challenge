import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'

export type CriarVeiculoInput = {
  id: string
  placa: string
  marca: string
  modelo: string
  ano: number
  cor?: string
  quilometragem?: number
  combustivel?: string
  observacoes?: string
}

export class CriarVeiculo {
  public executar(input: CriarVeiculoInput): Record<string, unknown> {
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

    return veiculo.toJSON()
  }
}
