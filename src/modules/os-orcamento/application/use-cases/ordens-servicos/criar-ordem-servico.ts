import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'

export type CriarOrdemServicoInput = {
  clienteId: string
  veiculoId: string
  descricao: string
  eGarantia: boolean
  servicos?: Array<OrdemServicoServico>
  components?: Array<OrdemServicoComponente>
}

export type CriarOrdemServicoOutput = {
  ordemServico: OrdemServico
}

export class CriaOrdemServicoUseCase {
  constructor(
    private clienteRepository: ClienteRepository,
    private veiculoRepository: VeiculoRepository,
    private servicoRepository: ServicoRepository
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

    if (input.servicos && input.servicos.length > 0) {
      // Extrai apenas as strings dos IDs de dentro do DTO de input
      const servicoIds = input.servicos.map(s => s.getServicoId().toValue())

      // Remove duplicados acidentais enviados pelo front para não quebrar o contador
      const idsUnicos = [...new Set(servicoIds)]

      // Faz uma única consulta no banco enviando o array completo de IDs
      const servicosExistentes = await this.servicoRepository.findManyByIds(idsUnicos)

      // Se o banco retornar menos itens do que pedimos, algum ID está quebrado!
      if (servicosExistentes.length !== idsUnicos.length) {
        // Opcional: Descobrir quais IDs são inválidos para dar uma resposta rica no erro
        const idsExistentes = servicosExistentes.map(s => s.getId())
        const idsInvalidos = idsUnicos.filter(id => !idsExistentes.includes(id))

        throw new Error(`Os seguintes serviços não foram encontrados no catálogo: ${idsInvalidos.join(', ')}`)
      }
    }

    const prioridade = Prioridade.calcular({
      eGarantia: input.eGarantia,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: input.servicos ? input.servicos.map(s => s.getCategoria()) : []
    });

    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(input.clienteId),
      veiculoId: new UniqueEntityID(input.veiculoId),
      descricao: input.descricao,
      eGarantia: input.eGarantia,
      prioridade,
      servicos: new OrdemServicoServicoList(input.servicos),
      componentes: new OrdemServicoComponenteList(input.components)
    })

    return {
      ordemServico
    }
  }
}
