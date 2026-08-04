import { Injectable } from "@nestjs/common";
import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { RecursoNaoEncontradoError } from "@/core/errors/index.js";
import { Either, left, right } from "@/core/either.js";

interface ReativarProdutoInput {
  produtoId: string
}

type Errors = RecursoNaoEncontradoError

type ReativarProdutoOutput = Either<
  Errors,
  {
    produto: Produto
  }
>

@Injectable()
export class ReativarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) { }
  public async execute({
    produtoId
  }: ReativarProdutoInput): Promise<ReativarProdutoOutput> {

    const produto = await this.produtoRepository.findById(produtoId)

    if (!produto) {
      return left(new RecursoNaoEncontradoError('Produto'))
    }

    produto.reativar()

    await this.produtoRepository.save(produto)

    return right({
      produto
    })
  }
}