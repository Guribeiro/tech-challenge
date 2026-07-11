import { Produto, TipoProduto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";

export interface CriarProdutoInput {
  nome: string
  tipo: TipoProduto
  descricao?: string
  precoUnitario: number
  quantidadeEstoque: number
}

interface CriarProdutoOutput {
  produto: Produto
}

export class CriarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    nome,
    tipo,
    descricao,
    precoUnitario,
    quantidadeEstoque,
  }: CriarProdutoInput): Promise<CriarProdutoOutput> {

    const produtoFromNome = await this.produtoRepository.findByNome(nome)

    if (produtoFromNome) {
      throw new Error(`Já existe um produto ativo cadastrado com o nome "${nome}".`);
    }

    const produto = Produto.criar({
      nome,
      tipo,
      descricao,
      precoUnitario,
      quantidadeEstoque,
    })

    await this.produtoRepository.create(produto)

    return {
      produto
    }
  }
}