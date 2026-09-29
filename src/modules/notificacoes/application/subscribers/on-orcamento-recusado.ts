import { DomainEvents } from '@/core/events/domain-events.js'
import { EventHandler } from '@/core/events/event-handler.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { UsuariosRepository } from '@/modules/autenticacao/domain/repositories/usuarios-repository.js'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnOrcamentoRecusado implements EventHandler {
  private readonly logger = new Logger(OnOrcamentoRecusado.name)
  constructor(
    private readonly criarNotificacao: CriarNotificacaoUseCase,
    private readonly usuariosRepository: UsuariosRepository,
  ) {
    this.setupSubscriptions()
  }

  public setupSubscriptions(): void {
    DomainEvents.register(
      this.executar.bind(this),
      OrcamentoRecusadoEvent.name
    )
  }

  private async executar(event: OrcamentoRecusadoEvent): Promise<void> {
    const { orcamento } = event

    try {
      const recepcao = await this.usuariosRepository.findByEmail('recepcao@oficina.com')
      if (!recepcao) {
        this.logger.warn('Não foi possível notificar a recepção: usuário recepcao@oficina.com não encontrado.')
        return
      }

      await this.criarNotificacao.execute({
        destinatarioId: recepcao.getId().toValue(),
        conteudo: `Atenção! O cliente recusou o orçamento original da OS #${orcamento.getOrdemServicoId().toValue()}. Inicie o processo de renegociação.`,
        titulo: 'Orcamento recusado',
        template: 'orcamento-recusado',
      })
      this.logger.log(`Notificação enviada para a recepção sobre a recusa do orçamento ${orcamento.getId().toValue()}.`)
    } catch (error) {
      this.logger.error(`Falha ao notificar recepção sobre a recusa do orçamento ${orcamento.getId().toValue()}`, error)
    }
  }
}