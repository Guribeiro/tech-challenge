import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { RecepcionistaCriadoEvent } from '@/modules/os-orcamento/domain/events/recepcionista-criado-event.js'
import { CriarCredenciaisUseCase } from '../../application/use-cases/criar-credenciais.js'
import { OnRecepcionistaCriado } from '../../application/subscribers/on-recepcionista-criado.js'

describe('OnRecepcionistaCriado (Subscriber)', () => {
  let criarCredenciais: CriarCredenciaisUseCase
  let subscriber: OnRecepcionistaCriado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case
    criarCredenciais = {
      execute: vi.fn(),
    } as unknown as CriarCredenciaisUseCase

    // 2. Espia o registro de evento ANTES da instanciação no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnRecepcionistaCriado(criarCredenciais)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnRecepcionistaCriado(criarCredenciais)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      RecepcionistaCriadoEvent.name,
    )
  })

  it('deve criar credenciais para o recepcionista com a role RECEPCAO com sucesso', async () => {
    // Espia o log do NestJS
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula resposta Right (sucesso) do Use Case
    vi.mocked(criarCredenciais.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: { usuario: { getId: () => ({ toValue: () => 'user-uuid-123' }) } },
    } as any)

    const mockEvent = {
      recepcionista: {
        getId: () => ({ toValue: () => 'recepcionista-uuid-789' }),
        getEmail: () => ({ getValor: () => 'recepcao@oficina.com' }),
      },
    } as unknown as RecepcionistaCriadoEvent

    await handler(mockEvent)

    // Valida a chamada do Use Case com a role 'RECEPCAO'
    expect(criarCredenciais.execute).toHaveBeenCalledWith({
      id: 'recepcionista-uuid-789',
      email: 'recepcao@oficina.com',
      role: 'RECEPCAO',
    })

    // Valida o log de sucesso conforme a mensagem da classe
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Autenticação] Credenciais criadas com sucesso para o ID: recepcionista-uuid-789',
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
      recepcionista: {
        getId: () => ({ toValue: () => 'recepcionista-uuid-789' }),
        getEmail: () => ({ getValor: () => 'recepcao@oficina.com' }),
      },
    } as unknown as RecepcionistaCriadoEvent

    await handler(mockEvent)

    // Valida se o aviso (warn) foi disparado
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Autenticação] Não foi possível criar credenciais para o recepcionista ID: recepcionista-uuid-789.',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de comunicação com o banco')
    vi.mocked(criarCredenciais.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      recepcionista: {
        getId: () => ({ toValue: () => 'recepcionista-uuid-789' }),
        getEmail: () => ({ getValor: () => 'recepcao@oficina.com' }),
      },
    } as unknown as RecepcionistaCriadoEvent

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