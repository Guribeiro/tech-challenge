import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"

interface ConcluirDiagnosticoInput {
  ordemServicoId: string
  novosServicos?: OrdemServicoServico[]
  novosComponentes?: OrdemServicoComponente[]
}


export class ConcluirDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
  ) { }

  public async execute(input: ConcluirDiagnosticoInput): Promise<void> {
    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)
    if (!ordemServico) {
      throw new Error(`Ordem de Serviço ${input.ordemServicoId} não encontrada.`)
    }

    ordemServico.concluirDiagnostico(input.novosServicos, input.novosComponentes)

    await this.ordemServicoRepository.save(ordemServico)
  }
}