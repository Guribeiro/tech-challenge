import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Notificacao } from '@/modules/notificacoes/domain/entities/notificacao.js'
import { NotificacaoCriadaEvent } from '../../domain/events/notificacao-criada-event.js'

describe('Entidade: Notificação', () => {
  it('deve ser possível criar uma nova notificação e registrar o evento de domínio', () => {
    const destinatarioId = new UniqueEntityID('usr-uuid-123')

    const notificacao = Notificacao.create({
      destinatarioId,
      titulo: 'Notificação de Teste',
      conteudo: 'Conteúdo informativo da notificação',
      template: 'boas-vindas',
      contexto: {
        nomeUsuario: 'Roberto Alves',
      },
    })

    expect(notificacao).toBeDefined()
    expect(notificacao.getId()).toBeInstanceOf(UniqueEntityID)
    expect(notificacao.getDestinatarioId()).toEqual(destinatarioId)
    expect(notificacao.getTitulo()).toBe('Notificação de Teste')
    expect(notificacao.getConteudo()).toBe('Conteúdo informativo da notificação')
    expect(notificacao.getTemplate()).toBe('boas-vindas')
    expect(notificacao.getContexto()).toEqual({ nomeUsuario: 'Roberto Alves' })
    expect(notificacao.getCriadaEm()).toBeInstanceOf(Date)
    expect(notificacao.getLidaEm()).toBeUndefined()

    // Valida se o evento de domínio NotificacaoCriadaEvent foi registrado
    expect(notificacao.domainEvents).toHaveLength(1)
    expect(notificacao.domainEvents[0]).toBeInstanceOf(NotificacaoCriadaEvent)
  })

  it('não deve disparar o evento de domínio ao instanciar com um ID existente', () => {
    const notificacaoId = new UniqueEntityID('notif-uuid-999')
    const destinatarioId = new UniqueEntityID('usr-uuid-123')

    const notificacao = Notificacao.create(
      {
        destinatarioId,
        titulo: 'Notificação Existente',
        conteudo: 'Conteúdo reconstituído do banco',
      },
      notificacaoId,
    )

    expect(notificacao.getId().toValue()).toEqual(notificacaoId.toValue())
    expect(notificacao.domainEvents).toHaveLength(0)
  })

  it('deve permitir marcar a notificação como lida', () => {
    const notificacao = Notificacao.create({
      destinatarioId: new UniqueEntityID('usr-uuid-123'),
      titulo: 'Notificação não lida',
      conteudo: 'Conteúdo',
    })

    expect(notificacao.getLidaEm()).toBeUndefined()

    notificacao.marcarComoLida()

    expect(notificacao.getLidaEm()).toBeInstanceOf(Date)
  })
})