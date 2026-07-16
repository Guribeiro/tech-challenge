// src/modules/faturamento/application/use-cases/confirmar-pagamento.ts
import { FaturaRepository } from "../../domain/repositories/faturas-repository.js"

interface ConfirmarPagamentoInput {
  faturaId: string
}

export class ConfirmarPagamentoUseCase {
  constructor(
    private readonly faturaRepository: FaturaRepository
  ) { }

  public async execute(input: ConfirmarPagamentoInput): Promise<void> {
    const fatura = await this.faturaRepository.findById(input.faturaId)

    if (!fatura) {
      throw new Error(`Fatura com ID ${input.faturaId} não encontrada.`)
    }

    fatura.pagar()

    // Ao salvar, o repositório faz o dispatch do evento de pagamento concluído
    await this.faturaRepository.save(fatura)

    console.log(`[Faturamento]: Pagamento confirmado com sucesso para a Fatura #${input.faturaId}`)
  }
}