import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { DomainEvents } from "@/core/events/domain-events.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { DiagnosticoInicializadoEvent } from "@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js"

export type IniciarDiagnosticoInput = {
  ordemServicoId: string
  mecanicoId: string
}

export type IniciarDiagnosticoutput = {
  ordemServico: OrdemServico
}

export class IniciarDiagnosticoeCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly mecanicoRepository: MecanicoRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly veiculoRepository: VeiculoRepository,
  ) { }

  public async executar({ ordemServicoId, mecanicoId }: IniciarDiagnosticoInput): Promise<IniciarDiagnosticoutput> {
    const ordemServico = await this.ordemServicoRepository.findById(ordemServicoId)

    if (!ordemServico) {
      throw new Error(`Ordem de serviço com ID ${ordemServicoId} não encontrada.`)
    }

    const mecanico = await this.mecanicoRepository.findById(mecanicoId)

    if (!mecanico) {
      throw new Error(`Mecânico com ID ${mecanicoId} não encontrado.`)
    }

    const veiculo = await this.veiculoRepository.findById(ordemServico.getVeiculoId().toValue())

    if (!veiculo) {
      throw new Error(`Veiculo na OS não encontrado`)
    }

    ordemServico.iniciarDiagnóstico(new UniqueEntityID(mecanico.getId()))

    await this.ordemServicoRepository.save(ordemServico)

    DomainEvents.dispatch(
      new DiagnosticoInicializadoEvent(new UniqueEntityID(ordemServico.getId()), ordemServico.getClienteId())
    );

    return {
      ordemServico
    }
  }
}