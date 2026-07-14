import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSExecucaoIniciadaEvent } from '../../domain/events/os-execucao-iniciada-event.js'
import { ReservarProdutosEstoqueUseCase } from '@/modules/estoque/application/use-cases/reservar-produtos-estoque.js' // Caminho fictício do seu outro módulo

export class OnExecucaoAutorizada implements EventHandler {
  constructor(
    private readonly reservarPecas: ReservarProdutosEstoqueUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSExecucaoIniciadaEvent.name
    )
  }

  private async executar(event: OSExecucaoIniciadaEvent): Promise<void> {
    const { ordemServico } = event

    // ⚡ Filtra se a OS de fato possui componentes/peças para serem reservados
    const componentes = ordemServico.getComponentes().getItems()
    if (componentes.length === 0) {
      console.log(`[Subscriber Info]: OS ${ordemServico.getId()} autorizada sem peças para reservar.`)
      return
    }

    try {
      // ⚡ O COMANDO NO INVENTÁRIO: Manda o módulo de inventário reservar as peças
      await this.reservarPecas.execute({
        ordemServicoId: ordemServico.getId(),
        itens: componentes.map(c => ({
          produtoId: c.getProdutoId().toValue(),
          quantidade: c.getQuantidade()
        }))
      })

      console.log(`[Subscriber Success]: Comando de reserva enviado ao Inventário para a OS ${ordemServico.getId()}`)
    } catch (error) {
      console.error(`[Subscriber Error]: Erro ao solicitar reserva de peças para a OS ${ordemServico.getId()}`, error)
    }
  }
}