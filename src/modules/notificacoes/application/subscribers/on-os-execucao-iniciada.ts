import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSExecucaoIniciadaEvent } from '../../../os-orcamento/domain/events/os-execucao-iniciada-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { Injectable, Logger } from '@nestjs/common'
import { ClienteOrdemServicoGateway } from '../gateways/cliente-ordem-servico-gateway.js'

@Injectable()
export class OnExecucaoIniciada implements EventHandler {
  private readonly logger = new Logger(OnExecucaoIniciada.name)
  constructor(
    private readonly clienteOrdemServicoGateway: ClienteOrdemServicoGateway,
    private readonly criarNotificacao: CriarNotificacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSExecucaoIniciadaEvent.name
    )
  }

  private async executar({ ordemServico }: OSExecucaoIniciadaEvent): Promise<void> {
    const ordemServicoId = ordemServico.getId().toValue()
    try {

      const dadosCliente = await this.clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId(ordemServicoId)

      if (!dadosCliente) {
        this.logger.warn(`[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #${ordemServico.getId().toValue()}.`)
        return
      }

      const { clienteNome } = dadosCliente

      await this.criarNotificacao.execute({
        destinatarioId: ordemServico.getClienteId().toValue(),
        conteudo: `Olá ${clienteNome}! O mecânico já iniciou a execução dos serviços no seu veículo (OS: ${ordemServico.getId().toValue()}).`,
        template: 'os-execucao-iniciada',
        titulo: 'Execução de OS iniciada',
      })

      this.logger.log(`[Notification Success]: Notificação de início de OS enviada para o cliente da OS ${ordemServico.getId().toValue()}`)
    } catch (error) {
      this.logger.error(`[Notification Error]: Falha ao disparar notificação para o cliente da OS ${ordemServico.getId().toValue()}`, error)
    }
  }
}