import { DomainEvents } from "@/core/events/domain-events.js"
import { EventHandler } from "@/core/events/event-handler.js"
import { OSExecucaoFinalizadaEvent } from "@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js"
import { EmitirFaturaUseCase } from "../use-cases/emitir-fatura.js"
import { OrcamentoGateway } from "../gateways/orcamento-gateway.js"

export class OnOrdemServicoFinalizadaEmitirFatura implements EventHandler {
  constructor(
    private readonly emitirFatura: EmitirFaturaUseCase,
    private readonly orcamentoGateway: OrcamentoGateway
  ) {
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
    const ordemServicoId = ordemServico.getId()

    try {

      const valorTotal = await this.orcamentoGateway.obterValorAprovadoPorOrdemServicoId(ordemServicoId)

      await this.emitirFatura.execute({
        ordemServicoId,
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