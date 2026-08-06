import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoInicializadoEvent } from '@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js'
import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '@/core/events/event-handler.js';
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js';
import { CriarNotificacaoUseCase } from '../use-cases/criar-notificacao.js';

@Injectable()
export class OnDiagnosticoInicializado implements EventHandler {
  private readonly logger = new Logger(OnDiagnosticoInicializado.name)
  constructor(
    private readonly clienteOrdemServicoGateway: ClienteOrdemServicoGateway,
    private readonly criarNotificacao: CriarNotificacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      DiagnosticoInicializadoEvent.name
    )
  }

  private async executar(event: DiagnosticoInicializadoEvent): Promise<void> {
    const { ordemServicoId, clienteId } = event

    try {
      const dadosCliente = await this.clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId(ordemServicoId.toValue())

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #${ordemServicoId.toValue()}.`)
        return
      }

      const { clienteNome } = dadosCliente
      const conteudo = `Olá ${clienteNome}! O mecânico acabou de iniciar o diagnóstico do seu veículo (OS: ${ordemServicoId.toValue()}).`

      await this.criarNotificacao.execute({
        destinatarioId: clienteId.toValue(),
        titulo: 'Diagnostico inicializado',
        conteudo,
        template: 'diagnostico-iniciado',
        contexto: {
          nome: clienteNome
        }
      })


      this.logger.log(`[Notification Success]: Notificação enviada para o cliente da OS ${ordemServicoId.toValue()}`)
    } catch (error) {
      this.logger.error(`[Notification Error]: Falha ao disparar notificação para o cliente da OS ${ordemServicoId.toValue()}`, error)
    }
  }
}