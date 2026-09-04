import { PaginationParams, PaginationResult, QueryStatus } from '@/core/repositories/pagination-params.js'
import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'

export type BuscarClientesParams = PaginationParams & {
  status?: QueryStatus
  nome?: string
}

export type BuscarClientesResultado = PaginationResult & {
  clientes: Cliente[]
}

export abstract class ClienteRepository {
  abstract create(cliente: Cliente): Promise<void>
  abstract save(cliente: Cliente): Promise<void>
  abstract findById(id: string): Promise<Cliente | null>
  abstract findByEmail(email: string): Promise<Cliente | null>
  abstract findByDocumento(documento: string): Promise<Cliente | null>
  abstract list(): Promise<Cliente[]>
  abstract findMany(params: BuscarClientesParams): Promise<BuscarClientesResultado>
  abstract delete(id: string): Promise<void>
}