import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/ordem-servico-componente.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/ordem-servico-servico.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'
import { ProdutoRepository } from '@/modules/estoque/domain/repositories/produtos-repository.js'
import { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'
import { Injectable } from '@nestjs/common'
import { EstoqueInsuficienteError, RecursoNaoEncontradoError } from '@/core/errors/index.js'
import { Either, left, right } from '@/core/either.js'

export type ComponenteItemInput = {
  produtoId: string
  quantidade: number
}

export type ServicoItemInput = {
  servicoId: string
}

export type CriarOrdemServicoInput = {
  clienteId: string
  veiculoId: string
  descricao: string
  eGarantia: boolean
  servicos?: Array<ServicoItemInput>
  componentes?: Array<ComponenteItemInput>
}

type Errors = RecursoNaoEncontradoError | EstoqueInsuficienteError

export type CriarOrdemServicoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class CriarOrdemServicoUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculoRepository: VeiculoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly servicoRepository: ServicoRepository,
    private readonly ordemServicoRepository: OrdemServicoRepository,
  ) { }
  public async execute(input: CriarOrdemServicoInput): Promise<CriarOrdemServicoOutput> {
    const cliente = await this.clienteRepository.findById(input.clienteId)
    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    const veiculo = await this.veiculoRepository.findById(input.veiculoId)
    if (!veiculo) {
      return left(new RecursoNaoEncontradoError('Veículo'))
    }

    const ordemServicoId = new UniqueEntityID()

    // Processamento de Serviços
    const servicosResult = await this.processarServicos(ordemServicoId, input.servicos)
    if (servicosResult.isLeft()) return left(servicosResult.value)

    const { itensServico, categoriasServicos } = servicosResult.value

    // Processamento de Componentes
    const componentesResult = await this.processarComponentes(ordemServicoId, input.componentes)
    if (componentesResult.isLeft()) return left(componentesResult.value)

    const { itensComponente } = componentesResult.value

    // Cálculo de Prioridade e Criação da Entidade
    const prioridade = Prioridade.calcular({
      eGarantia: input.eGarantia,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: categoriasServicos,
    })

    const ordemServico = OrdemServico.criar(
      {
        clienteId: new UniqueEntityID(input.clienteId),
        veiculoId: new UniqueEntityID(input.veiculoId),
        descricao: input.descricao,
        eGarantia: input.eGarantia,
        prioridade,
        servicos: new OrdemServicoServicoList(itensServico),
        componentes: new OrdemServicoComponenteList(itensComponente),
      },
      ordemServicoId,
    )

    await this.ordemServicoRepository.create(ordemServico)

    return right({ ordemServico })
  }

  private async processarServicos(
    ordemServicoId: UniqueEntityID,
    servicosInput?: Array<{ servicoId: string }>,
  ): Promise<Either<RecursoNaoEncontradoError, { itensServico: OrdemServicoServico[]; categoriasServicos: CategoriaServico[] }>> {
    if (!servicosInput?.length) {
      return right({ itensServico: [], categoriasServicos: [] })
    }

    const idsUnicos = [...new Set(servicosInput.map((s) => s.servicoId))]
    const servicosExistentes = await this.servicoRepository.findManyByIds(idsUnicos)

    if (servicosExistentes.length !== idsUnicos.length) {
      const idsExistentes = new Set(servicosExistentes.map((s) => s.getId().toValue()))
      const idsInvalidos = idsUnicos.filter((id) => !idsExistentes.has(id))
      return left(new RecursoNaoEncontradoError(`Seguintes serviços : ${idsInvalidos.join(', ')}`))
    }

    const servicosMap = new Map(servicosExistentes.map((s) => [s.getId().toValue(), s]))
    const itensServico: OrdemServicoServico[] = []
    const categoriasServicos: CategoriaServico[] = []

    for (const item of servicosInput) {
      const servicoDoCatalogo = servicosMap.get(item.servicoId)!
      categoriasServicos.push(servicoDoCatalogo.getCategoria())

      itensServico.push(
        OrdemServicoServico.criar({
          ordemServicoId,
          servicoId: servicoDoCatalogo.getId(),
          precoUnitario: servicoDoCatalogo.getValorReferencia(),
          categoria: servicoDoCatalogo.getCategoria(),
          nome: servicoDoCatalogo.getNome(),
        }),
      )
    }

    return right({ itensServico, categoriasServicos })
  }

  private async processarComponentes(
    ordemServicoId: UniqueEntityID,
    componentesInput?: Array<{ produtoId: string; quantidade: number }>,
  ): Promise<Either<RecursoNaoEncontradoError | EstoqueInsuficienteError, { itensComponente: OrdemServicoComponente[] }>> {
    if (!componentesInput?.length) {
      return right({ itensComponente: [] })
    }

    const idsUnicos = [...new Set(componentesInput.map((c) => c.produtoId))]
    const produtosExistentes = await this.produtoRepository.findManyByIds(idsUnicos)

    if (produtosExistentes.length !== idsUnicos.length) {
      const idsExistentes = new Set(produtosExistentes.map((p) => p.getId().toValue()))
      const idsInvalidos = idsUnicos.filter((id) => !idsExistentes.has(id))
      return left(new RecursoNaoEncontradoError(`Seguintes componentes : ${idsInvalidos.join(', ')}`))
    }

    const produtosMap = new Map(produtosExistentes.map((p) => [p.getId().toValue(), p]))
    const itensComponente: OrdemServicoComponente[] = []

    for (const item of componentesInput) {
      const produtoDoCatalogo = produtosMap.get(item.produtoId)!

      if (produtoDoCatalogo.getQuantidadeEstoque() < item.quantidade) {
        return left(new EstoqueInsuficienteError(produtoDoCatalogo.getNome()))
      }

      itensComponente.push(
        OrdemServicoComponente.criar({
          ordemServicoId,
          produtoId: produtoDoCatalogo.getId(),
          nome: produtoDoCatalogo.getNome(),
          tipo: produtoDoCatalogo.getTipo(),
          marca: produtoDoCatalogo.getMarca(),
          descricao: produtoDoCatalogo.getNome(),
          codigoSKU: produtoDoCatalogo.getCodigoSKU(),
          codigoFabricante: produtoDoCatalogo.getCodigoFabricante(),
          unidadeMedida: produtoDoCatalogo.getUnidadeMedida(),
          quantidade: item.quantidade,
          precoUnitario: produtoDoCatalogo.getPrecoUnitario(),
          precoCusto: produtoDoCatalogo.getPrecoCusto(),
        }),
      )
    }

    return right({ itensComponente })
  }
}
