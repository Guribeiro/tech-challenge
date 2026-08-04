import { PaginationParams, PaginationResult, QueryStatus } from '@/core/repositories/pagination-params.js'
import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'

export type BuscarServicosParams = PaginationParams & {
  nome?: string
  status?: QueryStatus
}

export type BuscarServicosResultado = PaginationResult & {
  servicos: Servico[]
}

export abstract class ServicoRepository {
  abstract create(servico: Servico): Promise<void>
  abstract save(servico: Servico): Promise<void>
  abstract findById(id: string): Promise<Servico | null>
  abstract findByNome(nome: string): Promise<Servico | null>
  abstract findManyByIds(ids: string[]): Promise<Servico[]>
  abstract delete(id: string): Promise<void>
  abstract findMany(params: BuscarServicosParams): Promise<BuscarServicosResultado>
}