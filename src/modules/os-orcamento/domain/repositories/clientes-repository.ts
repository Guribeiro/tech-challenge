import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'

export type StatusCliente = 'ativos' | 'deletados' | 'todos'

export interface BuscarClientesParams {
  pagina: number
  limite: number
  status?: StatusCliente
  nome?: string
}

export interface BuscarClientesResultado {
  clientes: Cliente[]
  total: number
  pagina: number
  limite: number
}

export abstract class ClienteRepository {
  abstract create(cliente: Cliente): Promise<void>
  abstract save(cliente: Cliente): Promise<void>
  abstract findById(id: string): Promise<Cliente | null>
  abstract findByEmail(email: string): Promise<Cliente | null>
  abstract findByCpf(cpf: string): Promise<Cliente | null>
  abstract list(): Promise<Cliente[]>
  abstract findMany(params: BuscarClientesParams): Promise<BuscarClientesResultado>
  abstract delete(id: string): Promise<void>
}