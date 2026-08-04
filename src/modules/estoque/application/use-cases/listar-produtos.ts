import { Either, right } from "@/core/either.js";
import { BuscarProdutosParams, BuscarProdutosResultado, ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { Injectable } from "@nestjs/common";

export type ListarProdutoInput = Partial<BuscarProdutosParams>
export type ListarProdutosOutput = Either<
  never,
  BuscarProdutosResultado
>

@Injectable()
export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute(input: ListarProdutoInput): Promise<ListarProdutosOutput> {
    const tipo = input.tipo
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'ativos'

    const { produtos, total } = await this.produtoRepository.findMany({
      tipo,
      nome: input.nome,
      pagina,
      limite,
      status
    })

    return right({
      produtos,
      total,
      pagina,
      limite,
    })
  }
}