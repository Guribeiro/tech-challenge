import { Injectable } from "@nestjs/common"
import { Either, left, right } from "@/core/either.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { ComponenteItemInput, ServicoItemInput } from "../ordens-servicos/criar-ordem-servico.js"
import { RenegociarOrcamentoService } from "@/modules/os-orcamento/domain/services/renegociar-orcamento.service.js"
import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js"

interface RenegociarOrcamentoInput {
  orcamentoId: string
  usuarioId: string
  servicos?: Array<ServicoItemInput & { id?: string }>
  componentes?: Array<ComponenteItemInput & { id?: string }>
  descontoPorcentagem: number
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type RenegociarOrcamentoOutput = Either<
  Errors,
  {
    orcamento: Orcamento
  }
>

@Injectable()
export class RenegociarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly usuarioRepository: UsuariosRepository,
    private readonly renegociarOrcamentoService: RenegociarOrcamentoService,
  ) { }

  public async execute({
    usuarioId,
    orcamentoId,
    componentes,
    servicos,
    descontoPorcentagem,
  }: RenegociarOrcamentoInput): Promise<RenegociarOrcamentoOutput> {
    const usuario = await this.usuarioRepository.findById(usuarioId)
    if (!this.hasPermission(usuario)) {
      return left(new AcessoNegadoError())
    }

    const orcamento = await this.orcamentoRepository.findById(orcamentoId)
    if (!orcamento) {
      return left(new RecursoNaoEncontradoError('Orçamento'))
    }

    const servicosOrError = await this.renegociarOrcamentoService.processarServicos(
      orcamento,
      servicos,
    )
    if (servicosOrError.isLeft()) return left(servicosOrError.value)

    const componentesOrError = await this.renegociarOrcamentoService.processarComponentes(
      orcamento,
      componentes,
    )
    if (componentesOrError.isLeft()) return left(componentesOrError.value)

    orcamento.renegociar(
      servicosOrError.value,
      componentesOrError.value,
      descontoPorcentagem,
    )

    await this.orcamentoRepository.save(orcamento)

    return right({ orcamento })
  }

  private hasPermission(usuario: Usuario | null): boolean {
    if (!usuario) return false
    const rolesPermitidas = new Set(['ADMIN', 'RECEPCAO', 'MECANICO'])
    return rolesPermitidas.has(usuario.getRole())
  }
}