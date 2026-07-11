import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";

interface ListarProdutosOutput {
  produtos: Produto[]
}

export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute(): Promise<ListarProdutosOutput> {

    const produtos = await this.produtoRepository.list()

    return {
      produtos
    }
  }
}