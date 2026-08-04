import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoInicializadoEvent } from '@/modules/os-orcamento/domain/events/diagnostico-inicializado-event.js'
import { NotificacaoService } from '@/modules/notificacoes/domain/services/notificacao-service.js'
import { ClienteOrdemServicoGateway } from '@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js'
import { OnDiagnosticoInicializado } from '../../application/subscribers/on-diagnostico-inicializado.js'

describe('OnDiagnosticoInicializado (Subscriber)', () => {
  let clienteOrdemServicoGateway: ClienteOrdemServicoGateway
  let notificacaoService: NotificacaoService
  let subscriber: OnDiagnosticoInicializado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências especificadas no subscriber
    clienteOrdemServicoGateway = {
      obterDadosClientePorOrdemServicoId: vi.fn(),
    } as unknown as ClienteOrdemServicoGateway

    notificacaoService = {
      enviar: vi.fn(),
    } as unknown as NotificacaoService

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que assina o evento no construtor)
    subscriber = new OnDiagnosticoInicializado(
      clienteOrdemServicoGateway,
      notificacaoService,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnDiagnosticoInicializado(clienteOrdemServicoGateway, notificacaoService)

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

    // Gateway retorna null para indicar que não encontrou o cliente
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    await handler(mockEvent)

    // Valida a chamada ao gateway com o ID da OS
    expect(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).toHaveBeenCalledWith('os-uuid-123')

    // Valida se o log de aviso (warn) foi emitido
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #os-uuid-123.',
    )

    // Garante que o serviço de notificação NÃO foi acionado
    expect(notificacaoService.enviar).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar os dados do cliente e enviar notificação de início de diagnóstico com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno dos dados do cliente
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce({
      clienteNome: 'João da Silva',
      clienteTelefone: '11988889999',
      ordemServicoId: 'os-uuid-123',
    })

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    await handler(mockEvent)

    // Valida se o NotificacaoService foi chamado com destinatário e mensagem formatados
    expect(notificacaoService.enviar).toHaveBeenCalledWith({
      destinatario: '11988889999',
      mensagem:
        'Olá João da Silva! O mecânico acabou de iniciar o diagnóstico do seu veículo (OS: os-uuid-123).',
    })

    // Valida log de sucesso
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

    const erroInesperado = new Error('Erro de conexão com gateway de SMS/Notificação')
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as DiagnosticoInicializadoEvent

    // Confirma que a exceção foi capturada e não estoura para fora
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log de erro no catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Falha ao disparar notificação para o cliente da OS os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})