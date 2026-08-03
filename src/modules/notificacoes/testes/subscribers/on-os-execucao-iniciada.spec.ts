import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSExecucaoIniciadaEvent } from '../../../os-orcamento/domain/events/os-execucao-iniciada-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteOrdemServicoGateway } from '../../application/gateways/cliente-ordem-servico-gateway.js'
import { OnExecucaoIniciada } from '../../application/subscribers/on-os-execucao-iniciada.js'

describe('OnExecucaoIniciada (Subscriber)', () => {
  let clienteOrdemServicoGateway: ClienteOrdemServicoGateway
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnExecucaoIniciada

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências
    clienteOrdemServicoGateway = {
      obterDadosClientePorOrdemServicoId: vi.fn(),
    } as unknown as ClienteOrdemServicoGateway

    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que se auto-registra no construtor
    subscriber = new OnExecucaoIniciada(
      clienteOrdemServicoGateway,
      enviarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnExecucaoIniciada(clienteOrdemServicoGateway, enviarNotificacao)

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

    // Gateway retorna null indicando que não encontrou os dados do cliente
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

    await handler(mockEvent)

    // Valida a consulta ao gateway com o ID da OS
    expect(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).toHaveBeenCalledWith('os-uuid-123')

    // Valida o disparo do log de aviso (warn)
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Dados do cliente não encontrados para a liberação da OS/Orçamento #os-uuid-123.',
    )

    // Confirma que a notificação NÃO foi enviada
    expect(enviarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar dados do cliente e disparar a notificação de início da execução dos serviços com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno de dados do cliente pelo gateway
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce({
      clienteNome: 'Roberto Alves',
      clienteTelefone: '11955554444',
      ordemServicoId: 'os-uuid-123',
    })

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

    await handler(mockEvent)

    // Valida a chamada do Use Case com destinatário e mensagem formatados
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: '11955554444',
      mensagem:
        'Olá Roberto Alves! O mecânico já iniciou a execução dos serviços no seu veículo (OS: os-uuid-123).',
    })

    // Valida o log de sucesso
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

    const erroInesperado = new Error('Falha de conexão com a API externa de mensageria')
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSExecucaoIniciadaEvent

    // Garante resiliência: o subscriber absorve o erro sem quebrar a execução
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a mensagem registrada no log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Notification Error]: Falha ao disparar notificação para o cliente da OS os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})