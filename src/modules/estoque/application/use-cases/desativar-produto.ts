import { Injectable } from "@nestjs/common";
import { Produto } from "../../domain/entities/produto.js";
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js";
import { RecursoNaoEncontradoError } from "@/core/errors/index.js";
import { Either, left, right } from "@/core/either.js";

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

    produto.desativar()

    await this.produtoRepository.save(produto)

    return right({
      produto
    })
  }
}