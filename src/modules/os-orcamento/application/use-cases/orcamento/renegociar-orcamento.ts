import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"

interface RenegociarOrcamentoInput {
  orcamentoId: string
  servicos?: Array<OrdemServicoServico>
  components?: Array<OrdemServicoComponente>
  descontoPorcentagem: number
}

interface RenegociarOrcamentoOutput {
  orcamento: Orcamento
}

export class RenegociarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
  ) { }

  public async execute({ orcamentoId, components, servicos, descontoPorcentagem }: RenegociarOrcamentoInput): Promise<RenegociarOrcamentoOutput> {
    const orcamento = await this.orcamentoRepository.findById(orcamentoId)

    if (!orcamento) {
      throw new Error(`Orçamento com ID ${orcamentoId} não encontrado.`)
    }

    const novosServicos = servicos ?? orcamento.getServicos()
    const novosComponentes = components ?? orcamento.getComponentes()

    orcamento.renegociar(novosServicos, novosComponentes, descontoPorcentagem)

    // O save vai persistir e despachar o 'ClienteAprovouOrcamentoEvent' automaticamente
    await this.orcamentoRepository.save(orcamento)

    return {
      orcamento
    }
  }
}