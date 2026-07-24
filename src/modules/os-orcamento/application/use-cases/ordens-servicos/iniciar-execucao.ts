import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"

export type IniciarExecucaoInput = {
  ordemServicoId: string
  mecanicoId: string
}

export type IniciarExecucaoOutput = {
  ordemServico: OrdemServico
}

export class IniciarExecucaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
  ) { }

  public async executar({ ordemServicoId, mecanicoId }: IniciarExecucaoInput): Promise<IniciarExecucaoOutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      throw new Error(`Ordem de serviço com ID ${ordemServicoId} não encontrada.`)
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      throw new Error(`Mecânico com ID ${mecanicoId} não encontrado.`)
    }

    ordemServico.iniciaExecucao()

    await this.ordemServicoRepository.save(ordemServico)

    return {
      ordemServico
    }
  }
}