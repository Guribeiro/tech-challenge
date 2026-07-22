import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'

export abstract class ClienteRepository {
  abstract create(cliente: Cliente): Promise<void>
  abstract save(cliente: Cliente): Promise<void>
  abstract findById(id: string): Promise<Cliente | null>
  abstract delete(id: string): Promise<void>
}