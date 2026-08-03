import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { ClienteCriadoEvent } from '@/modules/os-orcamento/domain/events/cliente-criado-event.js'
import { CriarCredenciaisUseCase } from '../../application/use-cases/criar-credenciais.js'
import { OnClienteCriado } from '../../application/subscribers/on-cliente-criado.js'

describe('OnClienteCriado (Subscriber)', () => {
  let criarCredenciais: CriarCredenciaisUseCase
  let subscriber: OnClienteCriado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do UseCase
    criarCredenciais = {
      execute: vi.fn(),
    } as unknown as CriarCredenciaisUseCase

    // 2. Espia o registro de evento ANTES de instanciar no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnClienteCriado(criarCredenciais)
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
    // Espia o log do NestJS
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock do usuario retornado no sucesso
    const mockUsuario = {
      getId: () => ({ toValue: () => 'usuario-uuid-789' }),
    }

    // Simula resposta Right (sucesso) do UseCase
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

    // Valida se o UseCase foi executado com os parametros e role corretos
    expect(criarCredenciais.execute).toHaveBeenCalledWith({
      id: 'cliente-uuid-123',
      email: 'cliente@email.com',
      role: 'CLIENTE',
    })

    // Valida o log de sucesso
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Autenticação] Credenciais criadas com sucesso para o ID: cliente-uuid-123. Usuário ID: usuario-uuid-789',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula resposta Left (erro de negócio)
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

    // Valida se o aviso (warn) foi disparado
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Autenticação] Não foi possível criar credenciais para o cliente ID: cliente-uuid-123.',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de conexão com o banco de dados')
    vi.mocked(criarCredenciais.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      cliente: {
        getId: () => ({ toValue: () => 'cliente-uuid-123' }),
        getEmail: () => ({ getValor: () => 'cliente@email.com' }),
      },
    } as unknown as ClienteCriadoEvent

    // Garante que o handler resolve e não estoura erro não capturado
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log de erro de infraestrutura
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Autenticação] Erro inesperado ao criar credenciais para o cliente ID: cliente-uuid-123',
      erroInesperado.stack,
    )

    loggerErrorSpy.mockRestore()
  })
})