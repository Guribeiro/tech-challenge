import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { NotificacaoCriadaEvent } from '@/modules/notificacoes/domain/events/notificacao-criada-event.js'
import { Notificacao } from '@/modules/notificacoes/domain/entities/notificacao.js'
import { OnNotificacaoCriada } from '../../application/subscribers/on-notificacao-criada.js'
import { InMemoryNotificacaoService } from '../services/in-memory-notificacao-service.js'
import { InMemoryUsuariosRepository } from '@/modules/autenticacao/testes/repositories/in-memory-users-repository.js'
import { Usuario } from '@/modules/autenticacao/domain/entities/usuario.js'
import { Email } from '@/shared/domain/value-objects/email.js'

describe('OnNotificacaoCriada (Subscriber)', () => {
  let fakeNotificacaoService: InMemoryNotificacaoService
  let usuariosRepository: InMemoryUsuariosRepository
  let subscriber: OnNotificacaoCriada

  beforeEach(() => {
    vi.clearAllMocks()

    fakeNotificacaoService = new InMemoryNotificacaoService()
    usuariosRepository = new InMemoryUsuariosRepository()

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnNotificacaoCriada(
      fakeNotificacaoService,
      usuariosRepository,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnNotificacaoCriada(fakeNotificacaoService, usuariosRepository)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      NotificacaoCriadaEvent.name,
    )
  })

  it('deve buscar o usuário e disparar o e-mail via InMemoryNotificacaoService com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Criar e salvar usuário em memória
    const usuarioId = new UniqueEntityID('usr-uuid-123')
    const usuario = Usuario.create(
      {
        email: Email.criar('cliente@oficina.com'),
        senhaHash: 'hashed_password',
        role: 'CLIENTE',
      },
      usuarioId,
    )
    await usuariosRepository.create(usuario)

    // Instancia a notificação do evento
    const notificacao = Notificacao.create({
      destinatarioId: usuarioId,
      titulo: 'Boas-vindas!',
      conteudo: 'Sua conta foi criada com sucesso.',
      template: 'usuario-criado',
      contexto: {
        nome: 'Carlos Silva',
      },
    })

    const mockEvent = new NotificacaoCriadaEvent(notificacao)

    await handler(mockEvent)

    // Valida se o serviço fake registrou o envio correto
    expect(fakeNotificacaoService.envios).toHaveLength(1)
    expect(fakeNotificacaoService.obterUltimoEnvio()).toEqual({
      destinatario: 'cliente@oficina.com',
      assunto: 'Boas-vindas!',
      template: 'usuario-criado',
      contexto: {
        nome: 'Carlos Silva',
      },
    })

    // Valida se o log de sucesso foi emitido
    expect(loggerLogSpy).toHaveBeenCalledWith(
      `[Notification Success]: Notificação ${notificacao.getId().toValue()} enviada para cliente@oficina.com`,
    )

    loggerLogSpy.mockRestore()
  })

  it('deve logar erro e não enviar e-mail caso o usuário destinatário não seja encontrado', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const notificacao = Notificacao.create({
      destinatarioId: new UniqueEntityID('usr-inexistente'),
      titulo: 'Notificação Órfã',
      conteudo: 'Teste de falha por usuário não encontrado',
    })

    const mockEvent = new NotificacaoCriadaEvent(notificacao)

    await handler(mockEvent)

    // Confirma que nenhum e-mail foi disparado
    expect(fakeNotificacaoService.envios).toHaveLength(0)

    // Valida a mensagem de erro no log
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Usuário com ID usr-inexistente não foi encontrado para envio da notificação.',
    )

    loggerErrorSpy.mockRestore()
  })

  it('deve capturar exceções no envio e registrar log de erro sem derrubar a execução', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const usuarioId = new UniqueEntityID('usr-uuid-123')
    const usuario = Usuario.create(
      {
        email: Email.criar('cliente@oficina.com'),
        senhaHash: 'hashed_password',
        role: 'CLIENTE',
      },
      usuarioId,
    )
    await usuariosRepository.create(usuario)

    const notificacao = Notificacao.create({
      destinatarioId: usuarioId,
      titulo: 'Erro Simulado',
      conteudo: 'Teste de resiliência',
    })

    const mockEvent = new NotificacaoCriadaEvent(notificacao)

    const erroInesperado = new Error('Falha simulada no serviço de envio')
    vi.spyOn(fakeNotificacaoService, 'enviar').mockRejectedValueOnce(erroInesperado)

    // Garante que a exceção é absorvida e não interrompe a aplicação
    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `[Notification Error]: Falha ao disparar notificação ${notificacao.getId().toValue()}`,
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})