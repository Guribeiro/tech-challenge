import { Either, left, right } from "@/core/either.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";
import { Injectable } from "@nestjs/common";

type ReativarServicoInput = {
  servicoId: string
}

type Errors = RecursoNaoEncontradoError

type ReativarServicoOutput = Either<
  Errors,
  {
    servico: Servico
  }
>

@Injectable()
export class ReativarServicoUseCase {
  constructor(
    private readonly servicoRepository: ServicoRepository
  ) { }

  public async execute({ servicoId }: ReativarServicoInput): Promise<ReativarServicoOutput> {
    const servico = await this.servicoRepository.findById(servicoId)

    if (!servico) {
      return left(new RecursoNaoEncontradoError('Serviço'))
    }

    servico.reativar()

    await this.servicoRepository.save(servico)

    return right({
      servico
    })
  }
}