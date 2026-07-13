import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
// import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"


interface ConcluirDiagnosticoInput {
  ordemServicoId: string
  novosServicos: OrdemServicoServico[]
  novosComponentes: OrdemServicoComponente[]
}

interface ConcluirDiagnosticoOutput {
  orcamentoId: string
}
export class ConcluirDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly orcamentoRepository: OrcamentoRepository
  ) { }

  public async execute(input: ConcluirDiagnosticoInput): Promise<ConcluirDiagnosticoOutput> {
    // 1. Busca a Ordem de Serviço
    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)
    if (!ordemServico) {
      throw new Error(`Ordem de Serviço ${input.ordemServicoId} não encontrada.`)
    }

    // 4. Altera o ciclo de vida da OS (ex: seta status como AGUARDANDO_APROVACAO)
    ordemServico.concluirDiagnostico(input.novosServicos, input.novosComponentes)

    // 5. Instancia o Orçamento capturando a fotografia atualizada dos itens da OS
    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(ordemServico.getId()),
      clienteId: ordemServico.getClienteId(),
      servicos: ordemServico.getServicos().getItems(),      // Retorna o estado final pós-update
      componentes: ordemServico.getComponentes().getItems(),  // Retorna o estado final pós-update
      status: 'CRIADO'
    })

    // 6. Persiste ambos no banco de dados
    await this.ordemServicoRepository.save(ordemServico)
    await this.orcamentoRepository.save(orcamento)

    return {
      orcamentoId: orcamento.getId()
    }
  }
}