import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { UsuarioCriadoEvent } from '@/modules/autenticacao/domain/events/usuario-criado-event.js'
import { EnviarNotificacaoUseCase } from '../../domain/use-cases/enviar-notificacao.js'
import { OnUsuarioCriado } from '../../application/subscribers/on-usuario-criado.js'

describe('OnUsuarioCriado (Subscriber)', () => {
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnUsuarioCriado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de notificação
    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que se auto-registra no construtor
    subscriber = new OnUsuarioCriado(enviarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnUsuarioCriado(enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      UsuarioCriadoEvent.name,
    )
  })

  it('deve disparar a notificação contendo a senha provisória e registrar log de sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockEvent = {
      usuario: {
        getEmail: () => ({
          getValor: () => 'novo.usuario@oficina.com',
        }),
      },
      senhaPlana: 'SenhaTemp123!',
    } as unknown as UsuarioCriadoEvent

    await handler(mockEvent)

    // Valida se o Use Case de notificação foi acionado com o e-mail e a senha provisória
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: 'novo.usuario@oficina.com',
      mensagem: 'Olá! A sua senha provisória é SenhaTemp123!.',
    })

    // Valida se o log de sucesso foi emitido com o e-mail do usuário
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Notification Success]: Notificação enviada para o usuário novo.usuario@oficina.com',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções no bloco catch e registrar log de erro sem derrubar a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha no servidor SMTP / envio de e-mail')
    vi.mocked(enviarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      usuario: {
        getEmail: () => ({
          getValor: () => 'novo.usuario@oficina.com',
        }),
      },
      senhaPlana: 'SenhaTemp123!',
    } as unknown as UsuarioCriadoEvent

    // Confirma resiliência: a exceção é absorvida pelo subscriber
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o erro foi registrado corretamente no logger com a exception
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Falha ao disparar notificação para o usuário novo.usuario@oficina.com',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})