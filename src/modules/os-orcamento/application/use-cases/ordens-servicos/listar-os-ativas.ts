import { Either, right } from "@/core/either.js"
import {
  ListarOrdensServicoAtivasParams,
  ListarOrdensServicoAtivasResultado,
  OrdemServicoRepository
} from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

export type ListarOrdensServicoAtivasInput = Partial<ListarOrdensServicoAtivasParams>

export type ListarOrdensServicoAtivasOutput = Either<
  never,
  ListarOrdensServicoAtivasResultado & {
    pagina: number
    limite: number
  }
>

@Injectable()
export class ListarOSAtivasUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async execute(
    input?: ListarOrdensServicoAtivasInput
  ): Promise<ListarOrdensServicoAtivasOutput> {
    const pagina = input?.pagina ?? 1
    const limite = input?.limite ?? 10

    const { ordensServicos, total } = await this.ordemServicoRepository.listActiveOrders({
      pagina,
      limite,
    })

    return right({
      ordensServicos,
      total,
      pagina,
      limite,
    })
  }
}