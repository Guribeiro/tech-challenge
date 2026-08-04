import { DomainEvents } from "@/core/events/domain-events.js"
import { EventHandler } from "@/core/events/event-handler.js"
import { OSExecucaoFinalizadaEvent } from "@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js"
import { EmitirFaturaUseCase } from "../use-cases/emitir-fatura.js"
import { OrcamentoGateway } from "../gateways/orcamento-gateway.js"
import { Injectable, Logger } from "@nestjs/common"

@Injectable()
export class OnOrdemServicoFinalizadaEmitirFatura implements EventHandler {
  private readonly logger = new Logger(OnOrdemServicoFinalizadaEmitirFatura.name)
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
    const ordemServicoId = ordemServico.getId().toValue()
    try {
      const { valorTotal, orcamentoId } = await this.orcamentoGateway.obterValorAprovadoPorOrdemServicoId(ordemServicoId)

      const result = await this.emitirFatura.execute({
        orcamentoId,
        valorTotal
      })

      if (result.isLeft()) {
        this.logger.warn(
          `[Subscriber Left Error]: Não foi possível emitir a fatura para a OS ${ordemServicoId}.`
        )
        return
      }

      const fatura = result.value
      this.logger.log(`Fatura emitida com sucesso para a OS ${ordemServicoId}. ID Fatura: ${fatura.getId().toValue()}`)

    } catch (error) {
      this.logger.error(
        `[Subscriber Exception]: Erro inesperado ao processar evento de emissão de fatura para a OS ${ordemServicoId}`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}