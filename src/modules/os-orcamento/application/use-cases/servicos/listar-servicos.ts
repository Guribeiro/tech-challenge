import { Injectable } from "@nestjs/common";
import { Either, right } from "@/core/either.js";
import {
  ServicoRepository,
  BuscarServicosParams,
  BuscarServicosResultado
} from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";

export type ListarServicosInput = Partial<BuscarServicosParams>
export type ListarServicosOutput = Either<
  never,
  BuscarServicosResultado
>

@Injectable()
export class ListarServicosUseCase {
  constructor(private readonly servicoRepository: ServicoRepository) { }
  public async execute(input: ListarServicosInput): Promise<ListarServicosOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'ativos'

    const { servicos, total } = await this.servicoRepository.findMany({
      nome: input.nome,
      pagina,
      limite,
      status
    })

    return right({
      servicos,
      total,
      pagina,
      limite,
    })
  }
}