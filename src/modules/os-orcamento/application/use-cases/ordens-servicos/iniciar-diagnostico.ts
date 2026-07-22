import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"

export type IniciarDiagnosticoInput = {
  ordemServicoId: string
  mecanicoId: string
}

export type IniciarDiagnosticoutput = {
  ordemServico: OrdemServico
}

export class IniciarDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
    private readonly veiculoRepository: VeiculoRepository,
  ) { }

  public async executar({ ordemServicoId, mecanicoId }: IniciarDiagnosticoInput): Promise<IniciarDiagnosticoutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      throw new Error(`Ordem de serviço com ID ${ordemServicoId} não encontrada.`)
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      throw new Error(`Mecânico com ID ${mecanicoId} não encontrado.`)
    }

    const veiculo = await this.veiculoRepository.findById(ordemServico.getVeiculoId().toValue())

    if (!veiculo) {
      throw new Error(`Veiculo na OS não encontrado`)
    }

    ordemServico.iniciarDiagnostico(mecanico.getId())

    await this.ordemServicoRepository.save(ordemServico)

    return {
      ordemServico
    }
  }
}