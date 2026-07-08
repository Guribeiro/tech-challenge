import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { Cliente } from "@/modules/os-orcamento/domain/entities/cliente.js"

export class InMemoryClienteRepository implements ClienteRepository {
  private clientes: Cliente[] = []

  async create(cliente: Cliente): Promise<void> {
    this.clientes.push(cliente)
  }

  async save(cliente: Cliente): Promise<void> {
    const index = this.clientes.findIndex(c => c.getId() === cliente.getId())
    if (index !== -1) {
      this.clientes[index] = cliente
    }
  }

  async findById(id: string): Promise<Cliente | null> {
    return this.clientes.find(c => c.getId() === id) || null
  }

  async delete(id: string): Promise<void> {
    this.clientes = this.clientes.filter(c => c.getId() !== id)
  }
}
