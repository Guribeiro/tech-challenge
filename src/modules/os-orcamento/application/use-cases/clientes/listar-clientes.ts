import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { ClienteRepository, StatusCliente } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'

export type ListarClienteInput = {
  pagina?: number
  limite?: number
  status?: StatusCliente
  nome?: string
}
export type ListarClienteOutput = {
  clientes: Cliente[]
  limite: number
  total: number
  pagina: number
}

@Injectable()
export class ListarClientesUseCase {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute(input: ListarClienteInput): Promise<ListarClienteOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'ativos'

    const { clientes, total } = await this.clienteRepository.findMany({
      nome: input.nome,
      pagina,
      limite,
      status
    })

    return {
      clientes,
      total,
      pagina,
      limite,
    }
  }
}
