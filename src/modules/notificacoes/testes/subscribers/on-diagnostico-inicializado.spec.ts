import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoInicializadoEvent } from '@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js'
import { OnDiagnosticoInicializado } from '../../application/subscribers/on-diagnostico-inicializado.js'

describe('OnDiagnosticoInicializado (Subscriber)', () => {
  let clienteOrdemServicoGateway: ClienteOrdemServicoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnDiagnosticoInicializado

  beforeEach(() => {
    vi.clearAllMocks()

    clienteOrdemServicoGateway = {
      obterDadosClientePorOrdemServicoId: vi.fn(),
    } as unknown as ClienteOrdemServicoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnDiagnosticoInicializado(
      clienteOrdemServicoGateway,
      criarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnDiagnosticoInicializado(clienteOrdemServicoGateway, criarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      DiagnosticoInicializadoEvent.name,
    )
  })

  it('deve logar aviso (warn) e encerrar a execução caso os dados do cliente não sejam encontrados no gateway', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
      clienteId: {
        toValue: () => 'cli-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    await handler(mockEvent)

    expect(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).toHaveBeenCalledWith('os-uuid-123')

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #os-uuid-123.',
    )

    expect(criarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar os dados do cliente e enviar notificação de início de diagnóstico com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce({
      clienteId: 'cli-uuid-123',
      clienteNome: 'João da Silva',
      clienteTelefone: '11988889999',
      ordemServicoId: 'os-uuid-123',
    })

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
      clienteId: {
        toValue: () => 'cli-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    await handler(mockEvent)

    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'cli-uuid-123',
      titulo: 'Diagnostico inicializado',
      conteudo:
        'Olá João da Silva! O mecânico acabou de iniciar o diagnóstico do seu veículo (OS: os-uuid-123).',
      template: 'diagnostico-iniciado',
      contexto: {
        nome: 'João da Silva',
      },
    })

    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Notification Success]: Notificação enviada para o cliente da OS os-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem interromper a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error(
      'Erro de conexão com gateway de SMS/Notificação',
    )
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
      clienteId: {
        toValue: () => 'cli-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Falha ao disparar notificação para o cliente da OS os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})