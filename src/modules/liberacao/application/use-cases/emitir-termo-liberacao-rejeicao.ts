import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { TermoLiberacao } from "../../domain/entities/termo-liberacao.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"
import { TermoLiberacaoRepository } from "../../domain/repositories/termoRepository.js"
import { Injectable } from "@nestjs/common"

interface EmitirTermoRejeicaoInput {
  ordemServicoId: string
}

interface EmitirTermoRejeicaoOutput {
  termo: TermoLiberacao
}

@Injectable()
export class EmitirTermoRejeicaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly veiculoRepository: VeiculoRepository,
    private readonly termoLiberacao: TermoLiberacaoRepository
  ) { }

  public async execute(input: EmitirTermoRejeicaoInput): Promise<EmitirTermoRejeicaoOutput> {
    const os = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!os) {
      throw new Error(`Ordem de serviço #${input.ordemServicoId} não encontrada.`)
    }
    const veiculo = await this.veiculoRepository.findById(os.getVeiculoId().toValue())

    if (!veiculo) {
      throw new Error(`Veículo ${os.getVeiculoId()} não encontrado`)
    }

    const termo = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'REJEICAO_ORCAMENTO'
    })

    await this.termoLiberacao.create(termo)

    return {
      termo
    }
  }
}