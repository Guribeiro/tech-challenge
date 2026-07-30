import { Either, left, right } from "@/core/either.js";
import { DomainError } from "@/core/errors/domain-errors/domain-error.js";
import { RecursoNaoEncontradoError } from "@/core/errors/index.js";
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";
import { Injectable } from "@nestjs/common";

type DesativarServicoInput = {
  servicoId: string
}

type Errors = RecursoNaoEncontradoError

type DesativarServicoOutput = Either<
  Errors,
  {
    servico: Servico
  }
>

@Injectable()
export class DesativarServicoUseCase {
  constructor(
    private readonly servicoRepository: ServicoRepository
  ) { }

  public async execute({ servicoId }: DesativarServicoInput): Promise<DesativarServicoOutput> {
    const servico = await this.servicoRepository.findById(servicoId)

    if (!servico) {
      return left(new RecursoNaoEncontradoError('Serviço'))
    }

    try {
      servico.desativar()

      await this.servicoRepository.save(servico)

      return right({
        servico
      })
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }
      throw error
    }
  }
}