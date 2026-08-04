import { Either, left, right } from "@/core/either.js"
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

export type IniciarExecucaoInput = {
  ordemServicoId: string
  mecanicoId: string
}

type Errors = RecursoNaoEncontradoError

export type IniciarExecucaoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class IniciarExecucaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
  ) { }

  public async execute({ ordemServicoId, mecanicoId }: IniciarExecucaoInput): Promise<IniciarExecucaoOutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem de Serviço'))
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      return left(new RecursoNaoEncontradoError('Mecânico'))
    }

    ordemServico.iniciaExecucao()

    await this.ordemServicoRepository.save(ordemServico)

    return right({
      ordemServico
    })
  }
}