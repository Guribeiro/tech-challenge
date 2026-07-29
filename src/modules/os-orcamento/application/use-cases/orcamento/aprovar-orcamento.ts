import { Either, left, right } from "@/core/either.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { Injectable } from "@nestjs/common"

interface AprovarOrcamentoInput {
  orcamentoId: string
  clienteId: string
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type AprovarOrcamentoOutput = Either<
  Errors,
  {
    orcamento: Orcamento
  }
>

@Injectable()
export class AprovarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) { }

  public async execute({ orcamentoId, clienteId }: AprovarOrcamentoInput): Promise<AprovarOrcamentoOutput> {
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

    orcamento.aprovar()

    await this.orcamentoRepository.save(orcamento)

    return right({
      orcamento
    })
  }
}