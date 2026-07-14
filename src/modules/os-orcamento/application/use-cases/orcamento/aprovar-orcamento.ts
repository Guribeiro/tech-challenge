import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
interface AprovarOrcamentoInput {
  orcamentoId: string
}

interface AprovarOrcamentoOutput {
  orcamento: Orcamento
}

export class AprovarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository
  ) { }

  public async execute({ orcamentoId }: AprovarOrcamentoInput): Promise<AprovarOrcamentoOutput> {
    const orcamento = await this.orcamentoRepository.findById(orcamentoId)

    if (!orcamento) {
      throw new Error(`Orçamento com ID ${orcamentoId} não encontrado.`)
    }

    // Altera o estado do orçamento e registra o evento na sacola
    orcamento.aprovar()

    // O save vai persistir e despachar o 'ClienteAprovouOrcamentoEvent' automaticamente
    await this.orcamentoRepository.save(orcamento)

    return {
      orcamento
    }
  }
}