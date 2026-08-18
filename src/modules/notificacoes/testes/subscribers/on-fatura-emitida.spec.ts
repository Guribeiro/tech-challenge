import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { ClienteOrcamentoGateway } from '@/modules/notificacoes/application/gateways/cliente-orcamento-gateway.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { OnFaturaEmitida } from '../../application/subscribers/on-fatura-emitida.js'

describe('OnFaturaEmitida (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnFaturaEmitida

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências
    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnFaturaEmitida(
      clienteOrcamentoGateway,
      criarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnFaturaEmitida(clienteOrcamentoGateway, criarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      FaturaEmitidaEvent.name,
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
      fatura: {
        getId: () => ({ toValue: () => 'fatura-uuid-123' }),
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-456' }),
        getValorTotal: () => 250.0,
      },
    } as unknown as FaturaEmitidaEvent

    await handler(mockEvent)

    // Valida se o gateway foi consultado com o ID do orçamento
    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-456')

    // Valida se a mensagem de aviso (warn) foi gerada
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: orcamento-uuid-456).',
    )

    // Garante que o caso de uso de envio de notificação NÃO foi chamado
    expect(criarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar os dados do cliente e disparar a notificação formatada com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno de dados do cliente pelo gateway
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      telefone: '11988887777',
      clienteId: 'cli-uuid-123',
      nome: 'Carlos Eduardo',
      ordemServicoId: 'os-uuid-789',
    })

    const mockEvent = {
      fatura: {
        getId: () => ({ toValue: () => 'fatura-uuid-123' }),
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-456' }),
        getValorTotal: () => 350.5,
      },
    } as unknown as FaturaEmitidaEvent

    await handler(mockEvent)

    // Valida se o Use Case de notificação foi executado com o DTO exato (conteudo, titulo, template)
    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'cli-uuid-123',
      conteudo:
        'Olá, Carlos Eduardo! A sua fatura referente ao serviço (OS #os-uuid-789) foi emitida com sucesso no valor de R$ 350.50.',
      titulo: 'Fatura de pagamento',
      template: 'fatura-emitida',
    })

    // Valida o log de sucesso
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Notificação enviada com sucesso para o cliente Carlos Eduardo (OS #os-uuid-789) após emissão da fatura.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem interromper a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de conexão com a infraestrutura de e-mail')
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      fatura: {
        getId: () => ({ toValue: () => 'fatura-uuid-123' }),
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-456' }),
        getValorTotal: () => 100.0,
      },
    } as unknown as FaturaEmitidaEvent

    // Garante que a exceção não estoura para fora do subscriber
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a chamada do log de erro no bloco catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #fatura-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})