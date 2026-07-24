import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'

interface ListarFilaTrabalhoMecanicoInput {
  mecanicoId?: string
}

interface ListarFilaTrabalhoMecanicoOutput {
  fila: OrdemServico[]
}

export class ListarFilaTrabalhoMecanicoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async execute(input: ListarFilaTrabalhoMecanicoInput = {}): Promise<ListarFilaTrabalhoMecanicoOutput> {
    const fila = await this.ordemServicoRepository.findManyReadyToInitialize(input.mecanicoId)

    return {
      fila
    }
  }
}