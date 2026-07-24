import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { ProdutosReservadosNoEstoqueEvent } from '@/modules/estoque/domain/events/produtos-reservados-no-estoque-event.js'
import { OrdemServicoRepository } from '../../domain/repositories/ordem-servico-repository.js'

export class OnProdutosReservados implements EventHandler {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    // ⚡ Se inscreve no evento de sucesso emitido pelo Estoque
    DomainEvents.register(
      this.executar.bind(this),
      ProdutosReservadosNoEstoqueEvent.name
    )
  }

  private async executar(event: ProdutosReservadosNoEstoqueEvent): Promise<void> {
    const osId = event.ordemServicoId.toValue()

    try {
      // 1. Busca a OS correspondente no banco
      const ordemServico = await this.ordemServicoRepository.findById(osId)

      if (!ordemServico) {
        throw new Error(`Ordem de Serviço ${osId} não foi encontrada para atualização de prontidão.`)
      }

      // 2. Executa a alteração de status no domínio
      ordemServico.marcarComoProntaParaIniciar()

      // 3. Persiste no banco de dados
      await this.ordemServicoRepository.save(ordemServico)

      console.log(`[Subscriber Success]: OS ${osId} atualizada com sucesso para PRONTA_PARA_INICIAR.`)
    } catch (error) {
      console.error(`[Subscriber Error]: Falha ao atualizar a OS ${osId} para pronta.`, error)
    }
  }
}