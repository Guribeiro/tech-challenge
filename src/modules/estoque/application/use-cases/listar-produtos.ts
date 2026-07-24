import { ListarClienteInput } from "@/modules/os-orcamento/application/use-cases/clientes/listar-clientes.js";
import { BuscarProdutosParams, BuscarProdutosResultado, ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { Injectable } from "@nestjs/common";

export type ListarProdutoInput = Partial<BuscarProdutosParams>
export type ListarProdutosOutput = BuscarProdutosResultado

@Injectable()
export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute(input: ListarClienteInput): Promise<ListarProdutosOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'ativos'

    const { produtos, total } = await this.produtoRepository.findMany({
      nome: input.nome,
      pagina,
      limite,
      status
    })

    return {
      produtos,
      total,
      pagina,
      limite,
    }
  }
}