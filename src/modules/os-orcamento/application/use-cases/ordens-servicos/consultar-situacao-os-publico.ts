import { Either, left, right } from "@/core/either.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js";
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js";
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js";
import { Injectable } from "@nestjs/common";

type ConsultarSituacaoOSPublicoInput = {
  placa: string
  documento: string
}

type Errors = RecursoNaoEncontradoError

export type ConsultarSituacaoOSPublicoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class ConsultarSituacaoOSPublicoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculosRepository: VeiculoRepository,
  ) { }

  public async execute(input: ConsultarSituacaoOSPublicoInput): Promise<ConsultarSituacaoOSPublicoOutput> {

    const cliente = await this.clienteRepository.findByDocumento(input.documento)

    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    const veiculo = await this.veiculosRepository.findByLicensePlate(input.placa)

    if (!veiculo) {
      return left(new RecursoNaoEncontradoError('Veículo'))
    }

    const ordemServico = await this.ordemServicoRepository.findByClienteIdAndVeiculoId(cliente.getId().toValue(), veiculo.getId().toValue())

    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem de Serviço'))
    }

    return right({ ordemServico })
  }
}
