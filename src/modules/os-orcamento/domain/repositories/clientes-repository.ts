import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'

export interface ClienteRepository {
  create(cliente: Cliente): Promise<void>
  save(cliente: Cliente): Promise<void>
  findById(id: string): Promise<Cliente | null>
  delete(id: string): Promise<void>
}