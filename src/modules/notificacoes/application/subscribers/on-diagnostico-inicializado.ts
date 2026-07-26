import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoInicializadoEvent } from '@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js'
import { ClienteRepository } from '../../../os-orcamento/domain/repositories/clientes-repository.js';
import { NotificacaoService } from '@/modules/notificacoes/domain/services/notificacao-service.js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventHandler } from '@/core/events/event-handler.js';

@Injectable()
export class OnDiagnosticoInicializado implements EventHandler, OnModuleInit {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly notificacaoService: NotificacaoService
  ) { }

  onModuleInit(): void {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    // Estamos dizendo: "DomainEvents, quando o DiagnosticoInicializadoEvent acontecer, execute a minha função"
    DomainEvents.register(
      this.executar.bind(this),
      DiagnosticoInicializadoEvent.name
    )
  }

  private async executar(event: DiagnosticoInicializadoEvent): Promise<void> {
    const { ordemServicoId, clienteId } = event

    // 1. Busca os dados do cliente no repositório
    const cliente = await this.clienteRepository.findById(clienteId.toValue())

    if (!cliente) {
      console.log(`[Notification Error]: Cliente da OS ${ordemServicoId.toValue()} não encontrado.`)
      return
    }

    const primeiroNome = cliente.getNome().getValor()
    const telefone = cliente.getTelefone().getValor()

    // 2. Monta a mensagem e dispara (Post-it Azul: "Envia Notificação")
    const mensagem = `Olá ${primeiroNome}! O mecânico acabou de iniciar o diagnóstico do seu veículo (OS: ${ordemServicoId.toValue()}).`

    await this.notificacaoService.enviar({
      destinatario: telefone,
      mensagem
    })

    console.log(`[Notification Success]: Notificação enviada para o cliente da OS ${ordemServicoId.toValue()}`)
  }
}