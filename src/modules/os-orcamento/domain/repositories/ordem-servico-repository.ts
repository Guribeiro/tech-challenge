import { PaginationParams, PaginationResult } from '@/core/repositories/pagination-params.js'
import { OrdemServico, StatusOS } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'

export type BuscarFilaTrabalhoParams = PaginationParams & {
  status?: StatusOS
}

export type BuscarFilaTrabalhoResultado = PaginationResult & {
  ordensServicos: OrdemServico[]
}

export interface CalcularTempoMedioParams {
  dataInicio?: Date;
  dataFim?: Date;
}

export type CalcularTempoMedioResultado = {
  tempoMedioMinutos: number;
  totalServicosConcluidos: number;
}

export abstract class OrdemServicoRepository {
  abstract create(ordem: OrdemServico): Promise<void>
  abstract save(ordem: OrdemServico): Promise<void>
  abstract findById(id: string): Promise<OrdemServico | null>
  abstract listServiceQueue(params: BuscarFilaTrabalhoParams): Promise<BuscarFilaTrabalhoResultado>
  abstract findManyReadyToInitialize(mecanicoId?: string): Promise<OrdemServico[]>
  abstract calcularTempoMedio(params?: CalcularTempoMedioParams): Promise<CalcularTempoMedioResultado>;
}