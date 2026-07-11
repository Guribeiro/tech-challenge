import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";

interface DesativarProdutoInput {
  produtoId: string
}

interface DesativarProdutoOutput {
  produto: Produto
}

export class DesativarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    produtoId
  }: DesativarProdutoInput): Promise<DesativarProdutoOutput> {
    const produto = await this.produtoRepository.findById(produtoId)

    if (!produto) {
      throw new Error(`Produto com ID ${produtoId} não encontrado`)
    }

    produto.desativar()

    await this.produtoRepository.save(produto)

    return {
      produto
    }

  }
}