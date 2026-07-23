import { BuscarClientesParams, BuscarClientesResultado, ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'

export type ListarClienteInput = Partial<BuscarClientesParams>

export type ListarClienteOutput = BuscarClientesResultado

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
