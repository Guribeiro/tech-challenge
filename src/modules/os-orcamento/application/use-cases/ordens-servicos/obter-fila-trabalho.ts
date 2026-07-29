import { Either, right } from "@/core/either.js"
import { BuscarFilaTrabalhoParams, BuscarFilaTrabalhoResultado, OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

export type ObterFilaTrabalhoInput = Partial<BuscarFilaTrabalhoParams>
export type ObterFilaTrabalhoOutput = Either<
  never,
  BuscarFilaTrabalhoResultado
>

@Injectable()
export class ObterFilaTrabalhoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async execute(input: ObterFilaTrabalhoInput): Promise<ObterFilaTrabalhoOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'RECEBIDA'

    const { ordensServicos, total } = await this.ordemServicoRepository.listServiceQueue({
      pagina,
      limite,
      status
    })

    return right({
      ordensServicos,
      total,
      pagina,
      limite,
    })
  }
}