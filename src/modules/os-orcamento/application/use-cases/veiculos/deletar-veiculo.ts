import { Either, left, right } from '@/core/either.js'
import { DomainError } from '@/core/errors/domain-errors/domain-error.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { Injectable } from '@nestjs/common'

export type DeletarVeiculoInput = {
  id: string
}

type Errors = RecursoNaoEncontradoError

export type DeletarVeiculoOutput = Either<
  Errors,
  {
    veiculo: Veiculo
  }
>

@Injectable()
export class DeletarVeiculoUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository,
  ) { }

  public async execute(input: DeletarVeiculoInput): Promise<DeletarVeiculoOutput> {
    const veiculo = await this.veiculosRepository.findById(input.id)

    if (!veiculo || veiculo.isDeletado()) {
      return left(new RecursoNaoEncontradoError('Veículo'))
    }

    try {
      veiculo.deletar()

      await this.veiculosRepository.save(veiculo)

      return right({
        veiculo
      })
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }
      throw error
    }
  }
}
