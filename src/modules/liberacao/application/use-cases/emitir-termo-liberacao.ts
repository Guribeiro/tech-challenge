import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { TermoLiberacao } from "../../domain/entities/termo-liberacao.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"
import { TermoLiberacaoRepository } from "../../domain/repositories/termoRepository.js"
import { Injectable } from "@nestjs/common"
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js"
import { Either, left, right } from "@/core/either.js"

interface EmitirTermoInput {
  ordemServicoId: string
}

type Errors = RecursoNaoEncontradoError

type EmitirTermoOutput = Either<
  Errors,
  {
    termo: TermoLiberacao
  }
>


@Injectable()
export class EmitirTermoLiberacaoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly veiculoRepository: VeiculoRepository,
    private readonly termoLiberacaoRepository: TermoLiberacaoRepository
  ) { }

  public async execute(input: EmitirTermoInput): Promise<EmitirTermoOutput> {
    const os = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!os) {
      return left(new RecursoNaoEncontradoError(`Ordem de serviço #${input.ordemServicoId} não encontrada.`))
    }
    const veiculo = await this.veiculoRepository.findById(os.getVeiculoId().toValue())

    if (!veiculo) {
      return left(new RecursoNaoEncontradoError(`Veículo ${os.getVeiculoId().toValue()} não encontrado`))
    }

    const termo = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'PAGAMENTO_APROVADO'
    })

    await this.termoLiberacaoRepository.create(termo)

    return right({
      termo
    })
  }
}