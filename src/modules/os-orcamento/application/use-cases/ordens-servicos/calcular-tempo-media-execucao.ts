import { Injectable } from '@nestjs/common';
import { CalcularTempoMedioParams, CalcularTempoMedioResultado, OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js';
import { Either, right } from '@/core/either.js';

type CalcularTempoMedioInput = CalcularTempoMedioParams

type CalcularTempoMedioOutput = Either<never, CalcularTempoMedioResultado>

@Injectable()
export class CalcularTempoMediaExecucaoServicosUseCase {
  constructor(private readonly ordemServicoRepository: OrdemServicoRepository) { }

  public async execute({ dataInicio, dataFim }: CalcularTempoMedioInput): Promise<CalcularTempoMedioOutput> {
    const { tempoMedioMinutos, totalServicosConcluidos } = await this.ordemServicoRepository.calcularTempoMedio({ dataInicio, dataFim })

    return right({
      tempoMedioMinutos,
      totalServicosConcluidos
    })
  }
}