import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { DiagnosticoConcluidoEvent } from '../../domain/events/diagnostico-concluido-event.js'
import { GerarOrcamentoUseCase } from '../use-cases/orcamento/gerar-orcamento.js'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OnDiagnosticoConcluido implements EventHandler {
  constructor(
    private readonly gerarOrcamento: GerarOrcamentoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    // Diz para o gerenciador central: "Quando o DiagnosticoConcluidoEvent rodar, me chama!"
    DomainEvents.register(
      this.executar.bind(this),
      DiagnosticoConcluidoEvent.name
    )
  }

  private async executar(event: DiagnosticoConcluidoEvent): Promise<void> {
    const { ordemServico } = event

    try {
      // ⚡ A REAÇÃO: Manda o caso de uso gerar o orçamento baseado na fotografia da OS
      await this.gerarOrcamento.execute({
        ordemServicoId: ordemServico.getId().toValue(),
        clienteId: ordemServico.getClienteId().toValue(),
        servicos: ordemServico.getServicos().getItems(),
        componentes: ordemServico.getComponentes().getItems()
      })

      console.log(`[Subscriber Success]: Orçamento gerado automaticamente para a OS ${ordemServico.getId().toValue()}`)
    } catch (error) {
      // Como eventos de domínio rodam em segundo plano, é vital ter um log de erro aqui
      console.error(
        `[Subscriber Error]: Falha ao gerar orçamento automático para a OS ${ordemServico.getId().toValue()}.`,
        error
      )
    }
  }
}