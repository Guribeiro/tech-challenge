import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

export type FinalizarExecucaoInput = {
  ordemServicoId: string
  mecanicoId: string
}

export type FinalizarExecucaoOutput = {
  ordemServico: OrdemServico
}

@Injectable()
export class FinalizarExecucaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
  ) { }

  public async execute({ ordemServicoId, mecanicoId }: FinalizarExecucaoInput): Promise<FinalizarExecucaoOutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      throw new Error(`Ordem de serviço com ID ${ordemServicoId} não encontrada.`)
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      throw new Error(`Mecânico com ID ${mecanicoId} não encontrado.`)
    }

    //todo validar se o mecanico é o mesmo presente na OS ou se é ADMIN.

    ordemServico.finalizaExecucao()

    await this.ordemServicoRepository.save(ordemServico)

    return {
      ordemServico
    }
  }
}