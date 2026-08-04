import { Injectable } from '@nestjs/common';
import { CalcularTempoMedioParams, CalcularTempoMedioResultado, OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js';
import { Either, left, right } from '@/core/either.js';
import { DataInicioMaiorQueDataFimError } from '@/core/errors/data-inicio-maior-data-fim-error.js';

type CalcularTempoMedioInput = CalcularTempoMedioParams

type Errors = DataInicioMaiorQueDataFimError

type CalcularTempoMedioOutput = Either<Errors, CalcularTempoMedioResultado>

@Injectable()
export class CalcularTempoMediaExecucaoServicosUseCase {
  constructor(private readonly ordemServicoRepository: OrdemServicoRepository) { }

  public async execute({ dataInicio, dataFim }: CalcularTempoMedioInput): Promise<CalcularTempoMedioOutput> {
    if (dataInicio && dataFim && dataInicio > dataFim) {
      return left(new DataInicioMaiorQueDataFimError());
    }
    const { tempoMedioMinutos, totalServicosConcluidos } = await this.ordemServicoRepository.calcularTempoMedio({ dataInicio, dataFim })

    return right({
      tempoMedioMinutos,
      totalServicosConcluidos
    })
  }
}