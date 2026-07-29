import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { PlacaJaCadastradaError } from '@/core/errors/placa-ja-cadastrada.js'
import { Either, left, right } from '@/core/either.js'

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

type Errors = RecursoNaoEncontradoError | PlacaJaCadastradaError

export type CriarVeiculoOutput = Either<
  Errors,
  {
    veiculo: Veiculo
  }
>

@Injectable()
export class CriarVeiculoUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async execute(input: CriarVeiculoInput): Promise<CriarVeiculoOutput> {
    const cliente = await this.clienteRepository.findById(input.clienteId)

    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    const veiculoComMesmaPlaca = await this.veiculosRepository.findByLicensePlate(input.placa)

    if (veiculoComMesmaPlaca) {
      return left(new PlacaJaCadastradaError())
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

    await this.veiculosRepository.create(veiculo)

    return right({
      veiculo
    })
  }
}
