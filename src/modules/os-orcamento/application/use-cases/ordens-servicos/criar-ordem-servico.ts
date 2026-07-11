import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

export type CriarOrdemServicoInput = {
  clienteId: string
  veiculoId: string
  descricao: string
  eGarantia: boolean
  servicos?: Array<OrdemServicoServico>
  components?: Array<OrdemServicoComponente>
}

export class CriaOrdemServico {
  constructor(
    private clienteRepository: ClienteRepository,
    private veiculoRepository: VeiculoRepository,
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

    return ordemServico
  }
}
