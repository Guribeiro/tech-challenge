import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'

export type CriarVeiculoInput = {
  clienteId: string
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
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async execute(input: CriarVeiculoInput): Promise<CriarVeiculoOutput> {
    const cliente = await this.clienteRepository.findById(input.clienteId)

    if (!cliente) {
      throw new Error('Cliente não registrado')
    }

    const veiculoComMesmaPlaca = await this.veiculosRepository.findByLicensePlate(input.placa)

    if (veiculoComMesmaPlaca) {
      throw new Error('Placa já registrada em outro veiculo')
    }

    const veiculo = Veiculo.criar({
      clienteId: cliente.getId(),
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
