import { Fatura } from "../../domain/entities/fatura.js"
import { FaturaRepository } from "../../domain/repositories/faturas-repository.js"

interface ConfirmarPagamentoInput {
  faturaId: string
}

interface ConfirmarPagamentoOutput {
  fatura: Fatura
}

export class ConfirmarPagamentoUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute(input: ConfirmarPagamentoInput): Promise<ConfirmarPagamentoOutput> {
    const fatura = await this.faturaRepository.findById(input.faturaId)

    if (!fatura) {
      throw new Error(`Fatura com ID ${input.faturaId} não encontrada.`)
    }

    fatura.pagar()

    // Ao salvar, o repositório faz o dispatch do evento de pagamento concluído
    await this.faturaRepository.save(fatura)

    return {
      fatura
    }
  }
}