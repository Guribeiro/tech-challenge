import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Fatura } from '../../domain/entities/fatura.js'
import { FaturaRepository } from '@/modules/faturamento/domain/repositories/faturas-repository.js'
import { Injectable } from '@nestjs/common'

interface EmitirFaturaInput {
  orcamentoId: string
  valorTotal: number
}

@Injectable()
export class EmitirFaturaUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute({ orcamentoId, valorTotal }: EmitirFaturaInput): Promise<void> {
    const fatura = Fatura.criar({
      orcamentoId: new UniqueEntityID(orcamentoId),
      valorTotal
    })

    await this.faturaRepository.create(fatura)
  }
}