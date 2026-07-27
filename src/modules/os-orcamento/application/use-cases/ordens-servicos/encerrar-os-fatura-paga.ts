import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable } from "@nestjs/common"

interface EncerrarOrdemServicoFaturaPagaInput {
  ordemServicoId: string
}

@Injectable()
export class EncerrarOrdemServicoFaturaPagaUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async execute(input: EncerrarOrdemServicoFaturaPagaInput): Promise<void> {
    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!ordemServico) {
      throw new Error('Ordem de Serviço não encontrada.')
    }

    ordemServico.encerrarPorFaturaPaga()

    await this.ordemServicoRepository.save(ordemServico)
  }
}