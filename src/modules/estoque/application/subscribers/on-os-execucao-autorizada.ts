import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSExecucaoAutorizadaEvent } from '../../../os-orcamento/domain/events/os-execucao-autorizada-event.js'
import { ReservarProdutosEstoqueUseCase } from '@/modules/estoque/application/use-cases/reservar-produtos-estoque.js' // Caminho fictício do seu outro módulo
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnExecucaoAutorizada implements EventHandler {
  private readonly logger = new Logger(OnExecucaoAutorizada.name)
  constructor(
    private readonly reservarPecas: ReservarProdutosEstoqueUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSExecucaoAutorizadaEvent.name
    )
  }

  private async executar(event: OSExecucaoAutorizadaEvent): Promise<void> {
    const { ordemServico } = event

    // ⚡ Filtra se a OS de fato possui componentes/peças para serem reservados
    const componentes = ordemServico.getComponentes().getItems()
    if (componentes.length === 0) {
      this.logger.log(`[Subscriber Info]: OS ${ordemServico.getId().toValue()} autorizada sem peças para reservar.`)
      return
    }

    try {
      await this.reservarPecas.execute({
        ordemServicoId: ordemServico.getId().toValue(),
        itens: componentes.map(c => ({
          produtoId: c.getProdutoId().toValue(),
          quantidade: c.getQuantidade()
        }))
      })

      this.logger.log(`[Subscriber Success]: Comando de reserva enviado ao Inventário para a OS ${ordemServico.getId().toValue()}`)
    } catch (error) {
      this.logger.error(`[Subscriber Error]: Erro ao solicitar reserva de peças para a OS ${ordemServico.getId().toValue()}`, error)
    }
  }
}