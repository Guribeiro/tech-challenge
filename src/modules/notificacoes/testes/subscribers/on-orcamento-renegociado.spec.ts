import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoRenegociadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteOrcamentoGateway } from '../../application/gateways/cliente-orcamento-gateway.js'
import { OnOrcamentoRenegociado } from '../../application/subscribers/on-orcamento-renegociado.js'

describe('OnOrcamentoRenegociado (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnOrcamentoRenegociado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências
    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que registra a assinatura no construtor
    subscriber = new OnOrcamentoRenegociado(
      clienteOrcamentoGateway,
      enviarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRenegociado(clienteOrcamentoGateway, enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoRenegociadoEvent.name,
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
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoEvent

    await handler(mockEvent)

    // Valida se o gateway foi consultado com o ID correto do orçamento
    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-123')

    // Valida se o log de aviso foi emitido com o ID do orçamento
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: orcamento-uuid-123).',
    )

    // Confirma que a notificação NÃO foi disparada
    expect(enviarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar dados do cliente e enviar notificação de proposta revisada com sucesso', async () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno positivo do gateway
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      nome: 'Fernanda Lima',
      telefone: '11966665555',
      ordemServicoId: 'os-uuid-789',
    })

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoEvent

    await handler(mockEvent)

    // Valida se o Use Case de notificação foi acionado com o template e link corretos
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: '11966665555',
      mensagem:
        'Olá Fernanda Lima! Preparamos uma proposta especial revisada para o seu veículo. Acesse o link para conferir as novas condições: [Link do Orçamento #orcamento-uuid-123]',
    })
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de timeout na API de mensagens')
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoEvent

    // Garante que o handler absorve a falha assíncrona
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o log de erro foi gravado no bloco catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao disparar nova proposta para o cliente',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})