import { BuscarClientesParams, BuscarClientesResultado, ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
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
    return this.clientes.find(c => c.getId().toValue() === id) || null
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return this.clientes.find(c => c.getEmail().getValor() === email) || null
  }

  async findByCpf(cpf: string): Promise<Cliente | null> {
    return this.clientes.find(c => c.getCpf().getValor() === cpf) || null
  }


  async list(): Promise<Cliente[]> {
    return this.clientes
  }

  async findMany({
    pagina,
    limite,
    status = 'ativos',
    nome,
  }: BuscarClientesParams): Promise<BuscarClientesResultado> {
    // 1. Aplica os filtros na lista em memória
    const filteredClientes = this.clientes.filter((item) => {
      // 🎯 Filtro por Status (baseado na existência da data deletadoEm)
      if (status === 'ativos' && item.getDeletadoEm() !== null) {
        return false
      }

      if (status === 'deletados' && item.getDeletadoEm() === null) {
        return false
      }

      // 🔍 Filtro por Nome (Contém o trecho e ignora maiúsculas/minúsculas)
      if (nome && !item.getNome().getValor().toLowerCase().includes(nome.toLowerCase())) {
        return false
      }

      return true
    })

    // 2. Ordena pelos mais recentes (simulando o orderBy do Prisma)
    const sortedClientes = filteredClientes.sort(
      (a, b) => b.getCriadoEm().getTime() - a.getCriadoEm().getTime()
    )

    // 3. Aplica a Paginação (equivalente ao skip e take)
    const startIndex = (pagina - 1) * limite
    const paginatedClientes = sortedClientes.slice(
      startIndex,
      startIndex + limite
    )

    // 4. Retorna no mesmo formato da interface
    return {
      clientes: paginatedClientes,
      total: filteredClientes.length, // Total de itens mantidos APÓS os filtros, mas ANTES da paginação
      pagina,
      limite,
    }
  }

  async delete(id: string): Promise<void> {
    this.clientes = this.clientes.filter(c => c.getId().toValue() !== id)
  }
}
