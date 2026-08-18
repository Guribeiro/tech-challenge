import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js'
import { TermoLiberacaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-emitido-event.js'
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-por-rejeicao-emitido-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { Injectable } from '@nestjs/common'

type TermoLiberacaoEvents = TermoLiberacaoEmitidoEvent | TermoLiberacaoPorRejeicaoEmitidoEvent

@Injectable()
export class OnTermoLiberacaoEmitido implements EventHandler {
  constructor(
    private readonly clienteOrdemServicoGateway: ClienteOrdemServicoGateway,
    private readonly criarNotificacao: CriarNotificacaoUseCase,
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
      const ordemServico = termo.getOrdemServicoId().toValue() // ou busque o ID do orçamento correspondente

      // Resolve nome, telefone e OS via Gateway da infraestrutura
      const dadosCliente = await this.clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId(ordemServico)

      if (!dadosCliente) {
        throw new Error(`[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #${ordemServico}.`)
      }

      const { ordemServicoId, clienteNome, clienteId } = dadosCliente

      // Mensagem personalizada conforme o motivo
      const conteudo = termo.getMotivo() === 'PAGAMENTO_APROVADO'
        ? `Olá, ${clienteNome}! O pagamento da sua OS #${ordemServicoId} foi confirmado e o seu veículo está liberado para retirada no pátio físico.`
        : `Olá, ${clienteNome}! Conforme sua solicitação, a OS #${ordemServicoId} foi encerrada e o seu veículo está liberado para retirada no pátio físico.`

      await this.criarNotificacao.execute({
        destinatarioId: clienteId,
        conteudo,
        titulo: 'Termo de liberacao',
        template: 'termo-liberacao'
      })

      console.log(`[Notification Success]: Cliente ${clienteNome} notificado da liberação da OS #${ordemServicoId}`)
    } catch (error) {
      console.error(
        `[Subscriber Warning]: Falha ao notificar cliente sobre a emissão do termo de liberação #${termo.getId().toValue()}`,
        error,
      )
    }
  }
}