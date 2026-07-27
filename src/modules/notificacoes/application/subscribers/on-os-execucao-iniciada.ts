import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSExecucaoIniciadaEvent } from '../../../os-orcamento/domain/events/os-execucao-iniciada-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '../../../os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable, OnModuleInit } from '@nestjs/common'

@Injectable()
export class OnExecucaoIniciada implements EventHandler, OnModuleInit {
  constructor(
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
    private readonly clienteRepository: ClienteRepository
  ) { }
  onModuleInit(): void {
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

    try {

      const cliente = await this.clienteRepository.findById(ordemServico.getClienteId().toValue())

      if (!cliente) return

      // ⚡ Chama o seu caso de uso de notificação de forma limpa e desacoplada!
      await this.enviarNotificacao.execute({
        destinatario: cliente?.getTelefone().getValor(),
        mensagem: `Olá! O mecânico já iniciou a execução dos serviços no seu veículo (OS: ${ordemServico.getId()}).`
      })

      console.log(`[Notification Success]: Notificação de início de OS enviada para o cliente da OS ${ordemServico.getId()}`)
    } catch (error) {
      console.error(`[Notification Error]: Falha ao disparar notificação para o cliente da OS ${ordemServico.getId()}`, error)
    }
  }
}