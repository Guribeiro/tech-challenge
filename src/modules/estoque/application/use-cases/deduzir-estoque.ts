import { Injectable } from "@nestjs/common"
import { ProdutoRepository } from "../../domain/repositories/produtos-repository.js"
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js"
import { DomainError } from "@/core/errors/domain-errors/domain-error.js"
import { Either, left, right } from "@/core/either.js"

interface ItemDeducao {
  produtoId: string
  quantidade: number
}

interface DeduzirEstoqueInput {
  ordemServicoId: string
  itens: ItemDeducao[]
}

type Errors = RecursoNaoEncontradoError | DomainError

export type DeduzirEstoqueOutput = Either<Errors, null>

@Injectable()
export class DeduzirEstoqueUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository
  ) { }

  public async execute(input: DeduzirEstoqueInput): Promise<DeduzirEstoqueOutput> {
    for (const item of input.itens) {
      const produto = await this.produtoRepository.findById(item.produtoId)

      if (!produto) {
        return left(new RecursoNaoEncontradoError(`Produto ${item.produtoId}`))
      }

      try {
        produto.confirmarReservaEDeduzir(item.quantidade)
        await this.produtoRepository.save(produto)
      } catch (error) {
        if (error instanceof DomainError) {
          return left(error)
        }
        throw error
      }
    }
    return right(null)
  }
}