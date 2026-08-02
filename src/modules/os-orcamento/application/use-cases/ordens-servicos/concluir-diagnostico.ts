import { Either, left, right } from "@/core/either.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js"
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { ConcluirDiagnosticoService } from "@/modules/os-orcamento/domain/services/concluir-diagnostico.service.js"
import { Injectable } from "@nestjs/common"
import { ComponenteItemInput, ServicoItemInput } from "./criar-ordem-servico.js"

interface ConcluirDiagnosticoInput {
  ordemServicoId: string
  usuarioId: string
  servicos?: Array<ServicoItemInput & { id?: string }>
  componentes?: Array<ComponenteItemInput & { id?: string }>
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type ConcluirDiagnosticoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class ConcluirDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly usuarioRepository: UsuariosRepository,
    private readonly concluirDiagnosticoService: ConcluirDiagnosticoService,
  ) { }

  public async execute(
    input: ConcluirDiagnosticoInput,
  ): Promise<ConcluirDiagnosticoOutput> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId)
    if (!usuario) {
      return left(new AcessoNegadoError())
    }

    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)
    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem de Serviço'))
    }

    if (!this.canConclude(usuario, ordemServico, input.usuarioId)) {
      return left(
        new AcessoNegadoError(
          'Apenas o mecânico responsável que iniciou o diagnóstico (ou um gestor) pode concluí-lo.',
        ),
      )
    }

    const servicosOrError = await this.concluirDiagnosticoService.processarServicos(
      ordemServico,
      input.servicos,
    )
    if (servicosOrError.isLeft()) return left(servicosOrError.value)

    const componentesOrError = await this.concluirDiagnosticoService.processarComponentes(
      ordemServico,
      input.componentes,
    )
    if (componentesOrError.isLeft()) return left(componentesOrError.value)

    ordemServico.concluirDiagnostico(servicosOrError.value, componentesOrError.value)

    await this.ordemServicoRepository.save(ordemServico)

    return right({ ordemServico })
  }

  private canConclude(
    usuario: Usuario,
    ordemServico: OrdemServico,
    usuarioId: string,
  ): boolean {
    const isOwner = ordemServico.getMecanicoId()?.toValue() === usuarioId
    const rolesPermitidas = new Set(['ADMIN', 'RECEPCAO'])
    const isAdminOrReception = rolesPermitidas.has(usuario.getRole())

    return isOwner || isAdminOrReception
  }
}