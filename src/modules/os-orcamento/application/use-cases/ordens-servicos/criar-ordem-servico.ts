import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { CategoriaServico, Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

interface OrdemServicoServico {
  servicoId: string // ◄── Removido o '?' (Agora é obrigatório!)
  nome: string
  descricao?: string
  categoria: CategoriaServico
  precoUnitario: number
  observacao?: string
}

export type CriarOrdemServicoInput = {
  clienteId: string
  veiculoId: string
  descricao: string
  eGarantia: boolean
  servicos: Array<OrdemServicoServico>
  itens?: Array<{
    tipo: 'PECA' | 'INSUMO'
    descricao: string
    quantidade: number
  }>
}

export class CriaOrdemServico {
  constructor(
    private clienteRepository: ClienteRepository,
    private veiculoRepository: VeiculoRepository,
    private servicoRepository: ServicoRepository
  ) { }
  public async execute(input: CriarOrdemServicoInput): Promise<OrdemServico> {

    const cliente = await this.clienteRepository.findById(input.clienteId)

    if (!cliente) {
      throw new Error(`Cliente com ID ${input.clienteId} não encontrado.`)
    }

    const veiculo = await this.veiculoRepository.findById(input.veiculoId)

    if (!veiculo) {
      throw new Error(`Veículo com ID ${input.veiculoId} não encontrado.`)
    }

    const servicos = input.servicos?.map((servicoInput) => ({
      servico: Servico.criar({
        nome: servicoInput.nome,
        descricao: servicoInput.descricao,
        categoria: servicoInput.categoria,
        valorReferencia: servicoInput.precoUnitario,
      }),
      observacao: servicoInput.observacao,
    }))

    const prioridadeCalculada = Prioridade.calcular({
      eGarantia: input.eGarantia,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: servicos.map(s => s.servico.getCategoria())
    });

    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(input.clienteId),
      veiculoId: new UniqueEntityID(input.veiculoId),
      descricao: input.descricao,
      eGarantia: input.eGarantia,
      prioridade: prioridadeCalculada,
      servicos,
      itens: input.itens,
    })

    return ordemServico
  }
}
