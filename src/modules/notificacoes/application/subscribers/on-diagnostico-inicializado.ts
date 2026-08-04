import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoInicializadoEvent } from '@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js'
import { NotificacaoService } from '@/modules/notificacoes/domain/services/notificacao-service.js';
import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '@/core/events/event-handler.js';
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js';

@Injectable()
export class OnDiagnosticoInicializado implements EventHandler {
  private readonly logger = new Logger(OnDiagnosticoInicializado.name)
  constructor(
    private readonly clienteOrdemServicoGateway: ClienteOrdemServicoGateway,
    private readonly notificacaoService: NotificacaoService
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
    const { ordemServicoId } = event

    try {
      const dadosCliente = await this.clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId(ordemServicoId.toValue())

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #${ordemServicoId.toValue()}.`)
        return
      }


      const { clienteNome, clienteTelefone } = dadosCliente
      const mensagem = `Olá ${clienteNome}! O mecânico acabou de iniciar o diagnóstico do seu veículo (OS: ${ordemServicoId.toValue()}).`

      await this.notificacaoService.enviar({
        destinatario: clienteTelefone,
        mensagem
      })

      this.logger.log(`[Notification Success]: Notificação enviada para o cliente da OS ${ordemServicoId.toValue()}`)
    } catch (error) {
      this.logger.error(`[Notification Error]: Falha ao disparar notificação para o cliente da OS ${ordemServicoId.toValue()}`, error)
    }
  }
}