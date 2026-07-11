import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";

interface ReativarProdutoInput {
  produtoId: string
}

interface ReativarProdutoOutput {
  produto: Produto
}

export class ReativarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    produtoId
  }: ReativarProdutoInput): Promise<ReativarProdutoOutput> {

    const produto = await this.produtoRepository.findById(produtoId)

    if (!produto) {
      throw new Error(`Produto com ID ${produtoId} não encontrado`)
    }


    produto.reativar()

    await this.produtoRepository.save(produto)

    return {
      produto
    }
  }
}