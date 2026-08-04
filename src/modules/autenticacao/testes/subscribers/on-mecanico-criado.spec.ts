import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { MecanicoCriadoEvent } from '@/modules/os-orcamento/domain/events/mecanico-criado-event.js'
import { CriarCredenciaisUseCase } from '../../application/use-cases/criar-credenciais.js'
import { OnMecanicoCriado } from '../../application/subscribers/on-mecanico-criado.js'

describe('OnMecanicoCriado (Subscriber)', () => {
  let criarCredenciais: CriarCredenciaisUseCase
  let subscriber: OnMecanicoCriado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case
    criarCredenciais = {
      execute: vi.fn(),
    } as unknown as CriarCredenciaisUseCase

    // 2. Espia o registro de evento ANTES da instanciação no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnMecanicoCriado(criarCredenciais)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnMecanicoCriado(criarCredenciais)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      MecanicoCriadoEvent.name,
    )
  })

  it('deve criar credenciais para o mecânico com a role MECANICO com sucesso', async () => {
    // Espia o log do NestJS
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock do usuário retornado no sucesso
    const mockUsuario = {
      getId: () => ({ toValue: () => 'usuario-uuid-123' }),
    }

    // Simula resposta Right (sucesso) do Use Case
    vi.mocked(criarCredenciais.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: { usuario: mockUsuario },
    } as any)

    const mockEvent = {
      mecanico: {
        getId: () => ({ toValue: () => 'mecanico-uuid-456' }),
        getEmail: () => ({ getValor: () => 'mecanico@oficina.com' }),
      },
    } as unknown as MecanicoCriadoEvent

    await handler(mockEvent)

    // Valida a chamada do Use Case com a role 'MECANICO'
    expect(criarCredenciais.execute).toHaveBeenCalledWith({
      id: 'mecanico-uuid-456',
      email: 'mecanico@oficina.com',
      role: 'MECANICO',
    })

    // Valida o log de sucesso
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Autenticação] Credenciais criadas com sucesso para o ID: mecanico-uuid-456.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (console.warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    // Espia o console.warn utilizado nesta classe
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
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
      mecanico: {
        getId: () => ({ toValue: () => 'mecanico-uuid-456' }),
        getEmail: () => ({ getValor: () => 'mecanico@oficina.com' }),
      },
    } as unknown as MecanicoCriadoEvent

    await handler(mockEvent)

    // Valida se o aviso (console.warn) foi disparado
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Autenticação] Não foi possível criar credenciais para o mecânico ID: mecanico-uuid-456.',
    )

    consoleWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de conexão com o banco de dados')
    vi.mocked(criarCredenciais.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      mecanico: {
        getId: () => ({ toValue: () => 'mecanico-uuid-456' }),
        getEmail: () => ({ getValor: () => 'mecanico@oficina.com' }),
      },
    } as unknown as MecanicoCriadoEvent

    // Garante que o handler resolve sem estourar a exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log de erro de infraestrutura
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Autenticação] Erro ao processar criação de credenciais:',
      erroInesperado.stack,
    )

    loggerErrorSpy.mockRestore()
  })
})