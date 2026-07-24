import { Injectable } from "@nestjs/common";
import { Produto, TipoProduto, UnidadeMedida } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";

export interface CriarProdutoInput {
  nome: string
  tipo: TipoProduto
  marca?: string
  codigoSKU?: string
  descricao?: string
  codigoFabricante?: string

  precoUnitario: number
  precoCusto: number

  quantidadeEstoque: number

  estoqueMinimo?: number
  estoqueMaximo?: number
  unidadeMedida?: UnidadeMedida
  localizacao?: string
}

interface CriarProdutoOutput {
  produto: Produto
}

@Injectable()
export class CriarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    nome,
    tipo,
    marca,
    codigoSKU,
    codigoFabricante,
    descricao,
    precoUnitario,
    precoCusto,
    quantidadeEstoque,
    unidadeMedida,
    estoqueMaximo,
    estoqueMinimo,
    localizacao,
  }: CriarProdutoInput): Promise<CriarProdutoOutput> {

    const produtoFromNome = await this.produtoRepository.findByNome(nome)

    if (produtoFromNome) {
      throw new Error(`Já existe um produto ativo cadastrado com o nome "${nome}".`);
    }

    const produto = Produto.criar({
      nome,
      tipo,
      marca,
      codigoSKU,
      codigoFabricante,
      descricao,
      precoUnitario,
      precoCusto,
      quantidadeEstoque,
      unidadeMedida,
      estoqueMaximo,
      estoqueMinimo,
      localizacao,
    })

    await this.produtoRepository.create(produto)

    return {
      produto
    }
  }
}