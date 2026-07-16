// src/modules/atendimento/application/use-cases/gerar-termo-rejeicao.ts
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
import { TermoLiberacao } from "../../domain/value-objects/termo-liberacao.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"

interface GerarTermoRejeicaoInput {
  ordemServicoId: string
}

interface GerarTermoRejeicaoOutput {
  termo: TermoLiberacao
}

export class GerarTermoRejeicaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly veiculoRepository: VeiculoRepository,
  ) { }

  public async execute(input: GerarTermoRejeicaoInput): Promise<GerarTermoRejeicaoOutput> {
    const os = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!os) {
      throw new Error(`Ordem de serviço #${input.ordemServicoId} não encontrada.`)
    }
    const veiculo = await this.veiculoRepository.findById(os.getVeiculoId().toValue())

    if (!veiculo) {
      throw new Error(`Veículo ${os.getVeiculoId()} não encontrado`)
    }

    // O Value Object monta e valida o documento em memória
    const termo = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'REJEICAO_ORCAMENTO'
    })

    return {
      termo
    }
  }
}