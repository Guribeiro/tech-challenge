import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Fatura } from '../../domain/entities/fatura.js'
import { FaturaRepository } from '@/modules/faturamento/domain/repositories/faturas-repository.js'
import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either.js'

interface EmitirFaturaInput {
  orcamentoId: string
  valorTotal: number
}

type EmitirFaturaUseCaseOutput = Either<never, Fatura>

@Injectable()
export class EmitirFaturaUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute({ orcamentoId, valorTotal }: EmitirFaturaInput): Promise<EmitirFaturaUseCaseOutput> {
    const fatura = Fatura.criar({
      orcamentoId: new UniqueEntityID(orcamentoId),
      valorTotal
    })

    await this.faturaRepository.create(fatura)

    return right(fatura)
  }
}