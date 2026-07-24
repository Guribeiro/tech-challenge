import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"

interface EncerrarOrdemServicoInput {
  ordemServicoId: string
}

export class EncerrarOrdemServicoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) { }

  public async execute(input: EncerrarOrdemServicoInput): Promise<void> {
    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!ordemServico) {
      throw new Error('Ordem de Serviço não encontrada.')
    }

    // Executa a regra de negócio sagrada dentro do objeto de domínio
    ordemServico.encerrarPorRejeicao()

    // Salva o novo estado ('ENCERRADA_POR_REJEICAO') no banco
    await this.ordemServicoRepository.save(ordemServico)
  }
}