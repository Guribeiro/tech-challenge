import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoEnviadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-enviado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '../../domain/repositories/clientes-repository.js'

export class OnOrcamentoEnviado implements EventHandler {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private enviarNotificacao: EnviarNotificacaoUseCase
  ) {
    this.setupSubscriptions()
  }

  // 1. Registra o ouvinte no ecossistema global de eventos da aplicação
  setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoEnviadoEvent.name
    )
  }

  // 2. Ação que será executada automaticamente quando o orçamento for enviado
  private async executar({ orcamento }: OrcamentoEnviadoEvent): Promise<void> {
    const clienteId = orcamento.getClienteId().toValue()

    const cliente = await this.clienteRepository.findById(clienteId)

    if (!cliente) return

    const telefone = cliente.getTelefone().getValor()
    const nome = cliente.getNome().getValor()
    const valorTotal = orcamento.getValorTotalGeral()

    // Aqui você chama o seu serviço/use-case de notificação (E-mail, WhatsApp, SMS)

    await this.enviarNotificacao.execute({
      destinatario: telefone,
      mensagem: `Olá ${nome}! O orçamento ficou em R$ ${valorTotal}.`
    })
  }
}