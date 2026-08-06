import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { UsuarioCriadoEvent } from '@/modules/autenticacao/domain/events/usuario-criado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { OnUsuarioCriado } from '../../application/subscribers/on-usuario-criado.js'

describe('OnUsuarioCriado (Subscriber)', () => {
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnUsuarioCriado

  beforeEach(() => {
    vi.clearAllMocks()

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnUsuarioCriado(criarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnUsuarioCriado(criarNotificacao)

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
        getId: () => ({ toValue: () => 'usr-uuid-123' }),
        getEmail: () => ({
          getValor: () => 'novo.usuario@oficina.com',
        }),
      },
      senhaPlana: 'SenhaTemp123!',
    } as unknown as UsuarioCriadoEvent

    await handler(mockEvent)

    // Valida se o Use Case de notificação foi acionado com o DTO e contexto do template corretos
    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'usr-uuid-123',
      titulo: 'Credenciais de acesso',
      conteudo: 'Olá! A sua senha provisória é SenhaTemp123!.',
      template: 'usuario-criado',
      contexto: {
        nome: 'novo.usuario@oficina.com',
        email: 'novo.usuario@oficina.com',
        senhaPlana: 'SenhaTemp123!',
      },
    })

    // Valida se o log de sucesso foi emitido
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
    vi.mocked(criarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      usuario: {
        getId: () => ({ toValue: () => 'usr-uuid-123' }),
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