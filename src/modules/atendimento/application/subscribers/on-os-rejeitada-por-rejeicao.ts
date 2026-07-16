// src/modules/atendimento/application/subscribers/on-ordem-servico-encerrada.ts
import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao.js'
import { GerarTermoRejeicaoUseCase } from '@/modules/atendimento/application/use-cases/gerar-termo-liberacao-rejeicao.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-case/enviar-notificacao.js'

export class OnOrdemServicoEncerradaPorRejeicao implements EventHandler {
  constructor(
    private readonly gerarTermoRejeicao: GerarTermoRejeicaoUseCase,
    private readonly enviarNotificacao: EnviarNotificacaoUseCase,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OSEncerradaPorRejeicaoEvent.name
    )
  }

  private async executar(event: OSEncerradaPorRejeicaoEvent): Promise<void> {
    const { ordemServico } = event

    try {
      // 1. Gera o texto do termo (Value Object)
      const { termo } = await this.gerarTermoRejeicao.execute({
        ordemServicoId: ordemServico.getId()
      })

      // 2. Envia o documento inteiro formatado por mensagem para o cliente
      await this.enviarNotificacao.execute({
        destinatario: ordemServico.getId(), // No MVP, simula o contato do cliente
        mensagem: `Olá! Seu veículo placa ${termo.getPlacaVeiculo()} foi liberado. Segue seu termo oficial:\n\n${termo.getConteudo()}`
      })

      // 3. Notifica a recepção com o mesmo termo para que guardem no chat/logs
      await this.enviarNotificacao.execute({
        destinatario: 'recepcao@oficina.com',
        mensagem: `A OS #${ordemServico.getId()} foi encerrada por rejeição. Segue o termo gerado:\n\n${termo.getConteudo()}`
      })

    } catch (error) {
      console.error(`Falha no processo automático pós-encerramento da OS #${ordemServico.getId()}`, error)
    }
  }
}