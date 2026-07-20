import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { TermoLiberacaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-emitido-event.js'
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-por-rejeicao-emitido-event.js' // ◄ Importa o segundo evento
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js'

type TermoLiberacaoEvents = TermoLiberacaoEmitidoEvent | TermoLiberacaoPorRejeicaoEmitidoEvent

export class OnTermoLiberacaoEmitido implements EventHandler {
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
      TermoLiberacaoEmitidoEvent.name
    )

    DomainEvents.register(
      this.executar.bind(this),
      TermoLiberacaoPorRejeicaoEmitidoEvent.name
    )
  }

  private async executar({ termo }: TermoLiberacaoEvents): Promise<void> {
    try {
      const osId = termo.getOrdemServicoId().toValue()

      const ordemServico = await this.ordemServicoRepository.findById(osId)

      if (!ordemServico) {
        throw new Error(`[Subscriber Warning]: OS #${osId} não encontrada para envio do termo de liberação.`)
      }

      const clienteId = ordemServico.getClienteId().toValue()
      const cliente = await this.clienteRepository.findById(clienteId)

      if (!cliente) {
        throw new Error(`[Subscriber Warning]: Cliente com ID ${clienteId} não encontrado para envio do termo de liberação.`)
      }

      const telefone = cliente.getTelefone().getValor()
      const nome = cliente.getNome().getValor()

      // 💡 Mensagem Dinâmica: Descobre o motivo para personalizar o texto enviado ao cliente
      const mensagem = termo.getMotivo() === 'PAGAMENTO_APROVADO'
        ? `Olá, ${nome}! O pagamento da sua OS #${osId} foi confirmado e o seu veículo está liberado para retirada no pátio físico.`
        : `Olá, ${nome}! Conforme sua solicitação, a OS #${osId} foi encerrada e o seu veículo está liberado para retirada no pátio físico.`

      // Dispara a notificação usando o seu use-case existente!
      await this.enviarNotificacao.execute({
        destinatario: telefone,
        mensagem
      })

      console.log(`[Notification Success]: Cliente ${nome} notificado da liberação da OS #${osId} por motivo de ${termo.getMotivo()}`)
    } catch (error) {
      console.error(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${termo.getId().toValue()}`, error)
    }
  }
}