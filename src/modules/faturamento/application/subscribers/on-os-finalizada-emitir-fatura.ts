import { DomainEvents } from "@/core/events/domain-events.js"
import { EventHandler } from "@/core/events/event-handler.js"
import { OSExecucaoFinalizadaEvent } from "@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js"
import { EmitirFaturaUseCase } from "../use-cases/emitir-fatura.js"
import { OrcamentoGateway } from "../gateways/orcamento-gateway.js"
import { Injectable, OnModuleInit } from "@nestjs/common"

@Injectable()
export class OnOrdemServicoFinalizadaEmitirFatura implements EventHandler, OnModuleInit {
  constructor(
    private readonly emitirFatura: EmitirFaturaUseCase,
    private readonly orcamentoGateway: OrcamentoGateway
  ) { }
  onModuleInit(): void {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSExecucaoFinalizadaEvent.name
    )
  }

  private async executar(event: OSExecucaoFinalizadaEvent): Promise<void> {
    const { ordemServico } = event
    const ordemServicoId = ordemServico.getId().toValue()

    try {

      const { valorTotal, orcamentoId } = await this.orcamentoGateway.obterValorAprovadoPorOrdemServicoId(ordemServicoId)

      await this.emitirFatura.execute({
        orcamentoId,
        valorTotal
      })

    } catch (error) {
      console.error(
        `[Subscriber Error]: Falha ao emitir fatura para a OS ${ordemServico.getId()}.`,
        error
      )
    }
  }
}