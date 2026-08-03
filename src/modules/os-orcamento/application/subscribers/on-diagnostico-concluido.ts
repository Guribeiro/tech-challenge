import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { DiagnosticoConcluidoEvent } from '../../domain/events/diagnostico-concluido-event.js'
import { GerarOrcamentoUseCase } from '../use-cases/orcamento/gerar-orcamento.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnDiagnosticoConcluido implements EventHandler {
  private readonly logger = new Logger(OnDiagnosticoConcluido.name)
  constructor(
    private readonly gerarOrcamento: GerarOrcamentoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      DiagnosticoConcluidoEvent.name
    )
  }

  private async executar(event: DiagnosticoConcluidoEvent): Promise<void> {
    const { ordemServico } = event

    try {
      await this.gerarOrcamento.execute({
        ordemServicoId: ordemServico.getId().toValue(),
        clienteId: ordemServico.getClienteId().toValue(),
        servicos: ordemServico.getServicos().getItems(),
        componentes: ordemServico.getComponentes().getItems()
      })
      this.logger.log(`[Subscriber Success]: Orçamento gerado automaticamente para a OS ${ordemServico.getId().toValue()}`)
    } catch (error) {
      // Como eventos de domínio rodam em segundo plano, é vital ter um log de erro aqui
      this.logger.error(
        `[Subscriber Error]: Falha ao gerar orçamento automático para a OS ${ordemServico.getId().toValue()}.`,
        error
      )
    }
  }
}