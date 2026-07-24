import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'

export class OnFaturaEmitida implements EventHandler {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly enviarNotificacao: EnviarNotificacaoUseCase
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      FaturaEmitidaEvent.name
    )
  }

  private async executar({ fatura }: FaturaEmitidaEvent): Promise<void> {
    try {
      const osId = fatura.getOrdemServicoId()

      const ordemServico = await this.ordemServicoRepository.findById(osId.toValue())

      if (!ordemServico) {
        throw new Error(`[Subscriber Warning]: OS #${osId.toValue()} não encontrada para envio da fatura.`)
      }

      const clienteId = ordemServico.getClienteId().toValue()

      const cliente = await this.clienteRepository.findById(clienteId)

      if (!cliente) {
        throw new Error(`[Subscriber Warning]: Cliente com ID ${clienteId} não encontrado para envio da fatura.`)
      }

      const telefone = cliente.getTelefone().getValor()
      const nome = cliente.getNome().getValor()
      const valorTotal = fatura.getValorTotal()

      // Dispara a notificação usando o SEU use-case existente!
      await this.enviarNotificacao.execute({
        destinatario: telefone,
        mensagem: `Olá, ${nome}! A sua fatura da OS #${osId} foi emitida com sucesso no valor de R$ ${valorTotal.toFixed(2)}.`
      })
    } catch (error) {
      console.error(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${fatura.getId()}`, error)
    }
  }
}