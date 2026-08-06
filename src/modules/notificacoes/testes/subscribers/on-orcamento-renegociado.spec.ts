import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoRenegociadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { ClienteOrcamentoGateway } from '../../application/gateways/cliente-orcamento-gateway.js'
import { OnOrcamentoRenegociado } from '../../application/subscribers/on-orcamento-renegociado.js'

describe('OnOrcamentoRenegociado (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnOrcamentoRenegociado

  beforeEach(() => {
    vi.clearAllMocks()

    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnOrcamentoRenegociado(
      clienteOrcamentoGateway,
      criarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRenegociado(clienteOrcamentoGateway, criarNotificacao)

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

    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoEvent

    await handler(mockEvent)

    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-123')

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: orcamento-uuid-123).',
    )
    expect(criarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar dados do cliente e enviar notificação de proposta revisada com sucesso', async () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      clienteId: 'cli-uuid-123',
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

    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'cli-uuid-123',
      conteudo:
        'Olá Fernanda Lima! Preparamos uma proposta especial revisada para o seu veículo. Acesse o link para conferir as novas condições: [Link do Orçamento #orcamento-uuid-123]',
      titulo: 'Orcamento renegociado recusado',
      template: 'orcamento-renegociado',
    })
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de timeout na API de e-mail')
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoEvent

    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao disparar nova proposta para o cliente',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})