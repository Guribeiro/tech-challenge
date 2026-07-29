import { Injectable } from "@nestjs/common"
import { Fatura } from "../../domain/entities/fatura.js"
import { FaturaRepository } from "../../domain/repositories/faturas-repository.js"
import { Either, left, right } from "@/core/either.js"
import { RecursoNaoEncontradoError } from "@/core/errors/index.js"

interface ConfirmarPagamentoInput {
  faturaId: string
}

type Errors = RecursoNaoEncontradoError

type ConfirmarPagamentoOutput = Either<
  Errors,
  {
    fatura: Fatura
  }
>

@Injectable()
export class ConfirmarPagamentoUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute(input: ConfirmarPagamentoInput): Promise<ConfirmarPagamentoOutput> {
    const fatura = await this.faturaRepository.findById(input.faturaId)

    if (!fatura) {
      return left(new RecursoNaoEncontradoError(`Fatura com ID ${input.faturaId}`))
    }

    if (fatura.estaPaga()) {
      return right({
        fatura
      })
    }

    fatura.pagar()

    await this.faturaRepository.save(fatura)

    return right({
      fatura
    })
  }
}