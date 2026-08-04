import { Injectable } from "@nestjs/common"
import { Either, left, right } from "@/core/either.js"
import { RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"

export type IniciarDiagnosticoInput = {
  ordemServicoId: string
  mecanicoId: string
}

type Errors = RecursoNaoEncontradoError

export type IniciarDiagnosticoutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class IniciarDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
    private readonly veiculoRepository: VeiculoRepository,
  ) { }

  public async execute({ ordemServicoId, mecanicoId }: IniciarDiagnosticoInput): Promise<IniciarDiagnosticoutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem Serviço'))
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      return left(new RecursoNaoEncontradoError('Mecâncio'))
    }

    const veiculo = await this.veiculoRepository.findById(ordemServico.getVeiculoId().toValue())

    if (!veiculo) {
      return left(new RecursoNaoEncontradoError('Veículo'))
    }

    ordemServico.iniciarDiagnostico(mecanico.getId())

    await this.ordemServicoRepository.save(ordemServico)

    return right({
      ordemServico
    })
  }
}