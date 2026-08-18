import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { ClienteCriadoEvent } from '@/modules/os-orcamento/domain/events/cliente-criado-event.js'
import { CriarCredenciaisUseCase } from '../../application/use-cases/criar-credenciais.js'
import { OnClienteCriado } from '../../application/subscribers/on-cliente-criado.js'

describe('OnClienteCriado (Subscriber)', () => {
  let criarCredenciais: CriarCredenciaisUseCase

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock do UseCase
    criarCredenciais = {
      execute: vi.fn(),
    } as unknown as CriarCredenciaisUseCase
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnClienteCriado(criarCredenciais)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      ClienteCriadoEvent.name,
    )
  })

  it('deve criar credenciais para o cliente com a role CLIENTE com sucesso', async () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    new OnClienteCriado(criarCredenciais)
    const handler = registerSpy.mock.calls[0][0]

    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const mockUsuario = {
      getId: () => ({ toValue: () => 'usuario-uuid-789' }),
    }

    vi.mocked(criarCredenciais.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: { usuario: mockUsuario },
    } as any)

    const mockEvent = {
      cliente: {
        getId: () => ({ toValue: () => 'cliente-uuid-123' }),
        getEmail: () => ({ getValor: () => 'cliente@email.com' }),
      },
    } as unknown as ClienteCriadoEvent

    await handler(mockEvent)

    expect(criarCredenciais.execute).toHaveBeenCalledWith({
      id: 'cliente-uuid-123',
      email: 'cliente@email.com',
      role: 'CLIENTE',
    })

    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Autenticação] Credenciais criadas com sucesso para o ID: cliente-uuid-123. Usuário ID: usuario-uuid-789',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    new OnClienteCriado(criarCredenciais)
    const handler = registerSpy.mock.calls[0][0]

    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    vi.mocked(criarCredenciais.execute).mockResolvedValueOnce({
      isLeft: () => true,
      isRight: () => false,
      value: new Error('Credenciais já cadastradas'),
    } as any)

    const mockEvent = {
      cliente: {
        getId: () => ({ toValue: () => 'cliente-uuid-123' }),
        getEmail: () => ({ getValor: () => 'cliente@email.com' }),
      },
    } as unknown as ClienteCriadoEvent

    await handler(mockEvent)

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Autenticação] Não foi possível criar credenciais para o cliente ID: cliente-uuid-123.',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro sem lançar exceção', async () => {
    // 1. Silencia o Logger.error ANTES de qualquer exceção acontecer para não vazar no console/stdout
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    new OnClienteCriado(criarCredenciais)
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de conexão com o banco de dados')
    vi.mocked(criarCredenciais.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      cliente: {
        getId: () => ({ toValue: () => 'cliente-uuid-123' }),
        getEmail: () => ({ getValor: () => 'cliente@email.com' }),
      },
    } as unknown as ClienteCriadoEvent

    // 2. Executa o handler
    await handler(mockEvent)

    // 3. Valida se o Logger foi invocado corretamente com a mensagem e o stack do erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Autenticação] Erro inesperado ao criar credenciais para o cliente ID: cliente-uuid-123',
      erroInesperado.stack,
    )

    loggerErrorSpy.mockRestore()
  })
})