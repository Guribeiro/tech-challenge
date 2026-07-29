import { Either, left, right } from "@/core/either.js"
import { Injectable } from "@nestjs/common"
import { RecursoNaoEncontradoError, AcessoNegadoError } from "@/core/errors/index.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js"

export type FinalizarExecucaoInput = {
  ordemServicoId: string
  mecanicoId: string
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

export type FinalizarExecucaoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class FinalizarExecucaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
    private readonly usuarioRepository: UsuariosRepository,
  ) { }

  public async execute({ ordemServicoId, mecanicoId }: FinalizarExecucaoInput): Promise<FinalizarExecucaoOutput> {
    const usuario = await this.usuarioRepository.findById(mecanicoId)

    if (!usuario) {
      return left(new AcessoNegadoError())
    }

    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem de Serviço'))
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      return left(new RecursoNaoEncontradoError('Mecânico'))
    }

    const isOwner = ordemServico.getMecanicoId()?.toValue() === mecanicoId

    const isAdminOrReception = ['ADMIN', 'RECEPCAO'].includes(usuario.getRole())

    if (!isOwner && !isAdminOrReception) {
      return left(new AcessoNegadoError('Apenas o mecânico responsável que iniciou o diagnóstico (ou um gestor) pode concluí-lo.'))
    }

    ordemServico.finalizaExecucao()

    await this.ordemServicoRepository.save(ordemServico)

    return right({
      ordemServico
    })
  }
}