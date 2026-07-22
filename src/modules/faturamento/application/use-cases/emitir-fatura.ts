import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Fatura } from '../../domain/entities/fatura.js'
import { FaturaRepository } from '@/modules/faturamento/domain/repositories/faturas-repository.js'

interface EmitirFaturaInput {
  ordemServicoId: string
  valorTotal: number
}

export class EmitirFaturaUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute({ ordemServicoId, valorTotal }: EmitirFaturaInput): Promise<void> {
    const fatura = Fatura.criar({
      ordemServicoId: new UniqueEntityID(ordemServicoId),
      valorTotal
    })

    await this.faturaRepository.save(fatura)
  }
}