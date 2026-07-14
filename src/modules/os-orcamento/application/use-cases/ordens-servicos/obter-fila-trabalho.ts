import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"

export type ObterFilaTrabalhoOutput = {
  fila: OrdemServico[]
}

export class ObterFilaTrabalhoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async executar(): Promise<ObterFilaTrabalhoOutput> {
    const fila = await this.ordemServicoRepository.listServiceQueue()

    return {
      fila
    }
  }
}