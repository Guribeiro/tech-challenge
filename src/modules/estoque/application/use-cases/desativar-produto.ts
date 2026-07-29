import { Injectable } from "@nestjs/common";
import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { RecursoNaoEncontradoError } from "@/core/errors/index.js";
import { Either, left, right } from "@/core/either.js";
import { ArgumentoInvalidoError } from "@/core/errors/domain-errors/argumento-invalido-error.js";
import { RegraDeNegocioVioladaError } from "@/core/errors/domain-errors/regra-de-negocio-violada-error.js";

interface DesativarProdutoInput {
  produtoId: string
}

type Errors = RecursoNaoEncontradoError

type DesativarProdutoOutput = Either<
  Errors,
  {
    produto: Produto
  }
>

@Injectable()
export class DesativarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    produtoId
  }: DesativarProdutoInput): Promise<DesativarProdutoOutput> {
    const produto = await this.produtoRepository.findById(produtoId)

    if (!produto) {
      return left(new RecursoNaoEncontradoError('Produto'))
    }

    try {
      produto.desativar()
    } catch (error) {
      if (error instanceof RegraDeNegocioVioladaError) {
        return left(error)
      }
      throw error // Lança novamente erros inesperados (ex: falhas de infra/banco)
    }

    await this.produtoRepository.save(produto)

    return right({
      produto
    })
  }
}