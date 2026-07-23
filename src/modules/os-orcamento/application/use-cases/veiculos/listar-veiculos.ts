import { BuscarVeiculosParams, BuscarVeiculosResultado, VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { Injectable } from '@nestjs/common'

export type ListarVeiculosInput = Partial<BuscarVeiculosParams>

export type ListarVeiculosOutput = BuscarVeiculosResultado

@Injectable()
export class ListarVeiculosUseCase {
  constructor(
    private readonly veiculosRepository: VeiculoRepository
  ) { }

  public async execute(input: ListarVeiculosInput): Promise<ListarVeiculosOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'ativos'

    const { veiculos, total } = await this.veiculosRepository.findMany({
      pagina,
      limite,
      status
    })
    return {
      veiculos,
      total,
      pagina,
      limite,
    }
  }
}
