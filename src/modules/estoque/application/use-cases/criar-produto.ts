import { Injectable } from "@nestjs/common";
import { Produto, TipoProduto, UnidadeMedida } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { CodigoSKUJaCadastradoError, ProdutoJaCadastradoError } from "@/core/errors/index.js";
import { Either, left, right } from "@/core/either.js";

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

type Errors = ProdutoJaCadastradoError | CodigoSKUJaCadastradoError

type CriarProdutoOutput = Either<
  Errors,
  {
    produto: Produto
  }
>

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
      return left(new ProdutoJaCadastradoError(nome))
    }

    if (codigoSKU) {
      const produtoFromCodigoSku = await this.produtoRepository.findByCodigoSku(codigoSKU)

      if (produtoFromCodigoSku) {
        return left(new CodigoSKUJaCadastradoError())
      }
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

    return right({
      produto
    })
  }
}