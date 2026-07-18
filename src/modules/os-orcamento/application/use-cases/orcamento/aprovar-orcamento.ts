import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"

interface AprovarOrcamentoInput {
  orcamentoId: string
  clienteId: string
}

interface AprovarOrcamentoOutput {
  orcamento: Orcamento
}

export class AprovarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) { }

  public async execute({ orcamentoId, clienteId }: AprovarOrcamentoInput): Promise<AprovarOrcamentoOutput> {
    const orcamento = await this.orcamentoRepository.findById(orcamentoId)

    if (!orcamento) {
      throw new Error(`Orçamento com ID ${orcamentoId} não encontrado.`)
    }

    const cliente = await this.clienteRepository.findById(clienteId)

    if (!cliente) {
      throw new Error('Cliente não encontrado')
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