import { Injectable } from "@nestjs/common"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { Either, left, right } from "@/core/either.js"
interface RecusarOrcamentoInput {
  orcamentoId: string
  clienteId: string
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type RecusarOrcamentoOutput = Either<
  Errors,
  {
    orcamento: Orcamento
  }
>

@Injectable()
export class RecusarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) { }

  public async execute({ orcamentoId, clienteId }: RecusarOrcamentoInput): Promise<RecusarOrcamentoOutput> {

    const orcamento = await this.orcamentoRepository.findById(orcamentoId)

    if (!orcamento) {
      return left(new RecursoNaoEncontradoError('Orçamento'))
    }

    const cliente = await this.clienteRepository.findById(clienteId)

    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    if (!orcamento.getClienteId().equals(cliente.getId())) {
      return left(new AcessoNegadoError())
    }

    orcamento.recusar()

    await this.orcamentoRepository.save(orcamento)

    return right({
      orcamento
    })
  }
}