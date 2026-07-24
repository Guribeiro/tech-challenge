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
import { CategoriaServico, Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'
import { Injectable } from '@nestjs/common'

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

export type CriarOrdemServicoOutput = {
  ordemServico: OrdemServico
}

@Injectable()
export class CriarOrdemServicoUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculoRepository: VeiculoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly servicoRepository: ServicoRepository,
    private ordemServicoRepository: OrdemServicoRepository,
  ) { }
  public async execute(input: CriarOrdemServicoInput): Promise<CriarOrdemServicoOutput> {

    const cliente = await this.clienteRepository.findById(input.clienteId)

    if (!cliente) {
      throw new Error(`Cliente com ID ${input.clienteId} não encontrado.`)
    }

    const veiculo = await this.veiculoRepository.findById(input.veiculoId)

    if (!veiculo) {
      throw new Error(`Veículo com ID ${input.veiculoId} não encontrado.`)
    }

    const ordemServicoId = new UniqueEntityID()

    // 3. Processamento de Serviços
    const itensServico: OrdemServicoServico[] = []
    const categoriasServicos: CategoriaServico[] = []

    if (input.servicos && input.servicos.length > 0) {
      const servicoIds = input.servicos.map((s) => s.servicoId)
      const idsUnicos = [...new Set(servicoIds)]
      const servicosExistentes = await this.servicoRepository.findManyByIds(idsUnicos)

      if (servicosExistentes.length !== idsUnicos.length) {
        const idsExistentes = servicosExistentes.map((s) => s.getId().toValue())
        const idsInvalidos = idsUnicos.filter((id) => !idsExistentes.includes(id))
        throw new Error(`Os seguintes serviços não foram encontrados: ${idsInvalidos.join(', ')}`)
      }

      // Cria um mapa para busca O(1) de preço/dados
      const servicosMap = new Map<string, Servico>(
        servicosExistentes.map((s) => [s.getId().toValue(), s]),
      )

      for (const item of input.servicos) {
        const servicoDoCatalogo = servicosMap.get(item.servicoId)!

        categoriasServicos.push(servicoDoCatalogo.getCategoria())

        itensServico.push(
          OrdemServicoServico.criar({
            ordemServicoId,
            servicoId: servicoDoCatalogo.getId(),
            precoUnitario: servicoDoCatalogo.getValorReferencia(), // Congela o valor
            categoria: servicoDoCatalogo.getCategoria(),
            nome: servicoDoCatalogo.getNome(),
          }),
        )
      }
    }

    const itensComponente: OrdemServicoComponente[] = []

    if (input.componentes && input.componentes.length > 0) {
      const produtoIds = input.componentes.map((c) => c.produtoId)
      const idsUnicos = [...new Set(produtoIds)]
      const produtosExistentes = await this.produtoRepository.findManyByIds(idsUnicos)

      if (produtosExistentes.length !== idsUnicos.length) {
        const idsExistentes = produtosExistentes.map((p) => p.getId().toValue())
        const idsInvalidos = idsUnicos.filter((id) => !idsExistentes.includes(id))
        throw new Error(`Os seguintes produtos/componentes não foram encontrados: ${idsInvalidos.join(', ')}`)
      }

      const produtosMap = new Map(
        produtosExistentes.map((p) => [p.getId().toValue(), p]),
      )

      for (const item of input.componentes) {
        const produtoDoCatalogo = produtosMap.get(item.produtoId)!

        // Opcional: Valida estoque disponível antes de vincular à OS
        if (produtoDoCatalogo.getQuantidadeEstoque() < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto "${produtoDoCatalogo.getNome()}".`)
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
    }

    // 5. Cálculo de Prioridade
    const prioridade = Prioridade.calcular({
      eGarantia: input.eGarantia,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: categoriasServicos,
    })

    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(input.clienteId),
      veiculoId: new UniqueEntityID(input.veiculoId),
      descricao: input.descricao,
      eGarantia: input.eGarantia,
      prioridade,
      servicos: new OrdemServicoServicoList(itensServico),
      componentes: new OrdemServicoComponenteList(itensComponente)
    }, ordemServicoId)

    await this.ordemServicoRepository.create(ordemServico)

    return {
      ordemServico
    }
  }
}
