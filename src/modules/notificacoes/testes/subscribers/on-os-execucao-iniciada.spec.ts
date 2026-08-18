import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSExecucaoIniciadaEvent } from '../../../os-orcamento/domain/events/os-execucao-iniciada-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { ClienteOrdemServicoGateway } from '../../application/gateways/cliente-ordem-servico-gateway.js'
import { OnExecucaoIniciada } from '../../application/subscribers/on-os-execucao-iniciada.js'

describe('OnExecucaoIniciada (Subscriber)', () => {
  let clienteOrdemServicoGateway: ClienteOrdemServicoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnExecucaoIniciada

  beforeEach(() => {
    vi.clearAllMocks()

    clienteOrdemServicoGateway = {
      obterDadosClientePorOrdemServicoId: vi.fn(),
    } as unknown as ClienteOrdemServicoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnExecucaoIniciada(
      clienteOrdemServicoGateway,
      criarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnExecucaoIniciada(clienteOrdemServicoGateway, criarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSExecucaoIniciadaEvent.name,
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
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

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

  it('deve buscar dados do cliente e disparar a notificação de início da execução dos serviços com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce({
      clienteId: 'cli-uuid-123',
      clienteNome: 'Roberto Alves',
      clienteTelefone: '11955554444',
      ordemServicoId: 'os-uuid-123',
    })

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getClienteId: () => ({ toValue: () => 'cli-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

    await handler(mockEvent)

    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'cli-uuid-123',
      conteudo:
        'Olá Roberto Alves! O mecânico já iniciou a execução dos serviços no seu veículo (OS: os-uuid-123).',
      template: 'os-execucao-iniciada',
      titulo: 'Execução de OS iniciada',
    })

    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Notification Success]: Notificação de início de OS enviada para o cliente da OS os-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error(
      'Falha de conexão com a API externa de mensageria',
    )
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Falha ao disparar notificação para o cliente da OS os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})