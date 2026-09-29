import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoEnviadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-enviado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { GerarTokenAprovacaoOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/gerar-token-aprovacao-orcamento.js'
import { ClienteOrcamentoGateway } from '../../application/gateways/cliente-orcamento-gateway.js'
import { OnOrcamentoEnviado } from '../../application/subscribers/on-orcamento-enviado.js'

describe('OnOrcamentoEnviado (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let gerarTokenAprovacao: GerarTokenAprovacaoOrcamentoUseCase
  let subscriber: OnOrcamentoEnviado

  beforeEach(() => {
    vi.clearAllMocks()

    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    gerarTokenAprovacao = {
      execute: vi.fn().mockResolvedValue({
        isLeft: () => false,
        isRight: () => true,
        value: { token: { getToken: () => 'token-aprovacao-123' } },
      }),
    } as unknown as GerarTokenAprovacaoOrcamentoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnOrcamentoEnviado(
      clienteOrcamentoGateway,
      criarNotificacao,
      gerarTokenAprovacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoEnviado(clienteOrcamentoGateway, criarNotificacao, gerarTokenAprovacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoEnviadoEvent.name,
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
        getValorTotalGeral: () => 1500.0,
      },
    } as unknown as OrcamentoEnviadoEvent

    await handler(mockEvent)

    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-123')

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: orcamento-uuid-123).',
    )

    expect(criarNotificacao.execute).not.toHaveBeenCalled()
    expect(gerarTokenAprovacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar os dados do cliente e disparar a notificação com sucesso ao enviar o orçamento', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      clienteId: 'cli-uuid-123',
      nome: 'Mariana Costa',
      telefone: '11977776666',
      ordemServicoId: 'os-uuid-456',
    })

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getValorTotalGeral: () => 125075,
        getValorBrutoTotal: () => 125075,
        getValorDesconto: () => 0,
        getDescontoPorcentagem: () => 0,
        getServicos: () => ({
          getItems: () => [{
            getNome: () => 'Revisão de freios',
            getDescricao: () => 'Inspeção e ajuste',
            getPrecoUnitario: () => 75000,
          }],
        }),
        getComponentes: () => ({
          getItems: () => [{
            getNome: () => 'Pastilha de freio',
            getDescricao: () => undefined,
            getQuantidade: () => 1,
            getUnidadeMedida: () => 'UN',
            getPrecoUnitario: () => 50075,
            getSubtotal: () => 50075,
          }],
        }),
        getClienteId: () => ({ toValue: () => 'cli-uuid-123' }),
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OrcamentoEnviadoEvent

    await handler(mockEvent)

    const appUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`

    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'cli-uuid-123',
      titulo: 'Orcamento',
      conteudo: 'Olá Mariana Costa! O orçamento ficou em R$ 1.250,75.',
      template: 'orcamento-enviado',
      contexto: {
        nome: 'Mariana Costa',
        ordemServicoId: 'os-uuid-456',
        servicos: [{
          nome: 'Revisão de freios',
          descricao: 'Inspeção e ajuste',
          valor: 'R$ 750,00',
        }],
        componentes: [{
          nome: 'Pastilha de freio',
          descricao: undefined,
          quantidade: 1,
          unidadeMedida: 'UN',
          valorUnitario: 'R$ 500,75',
          subtotal: 'R$ 500,75',
        }],
        valorBruto: 'R$ 1.250,75',
        valorDesconto: 'R$ 0,00',
        descontoPorcentagem: 0,
        valorTotal: 'R$ 1.250,75',
        token: 'token-aprovacao-123',
        linkAprovacao: new URL(
          '/api/orcamentos/decisoes/token-aprovacao-123',
          appUrl,
        ).toString(),
      },
    })
    expect(gerarTokenAprovacao.execute).toHaveBeenCalledWith({
      orcamentoId: 'orcamento-uuid-123',
    })

    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Notificação enviada com sucesso para o cliente Mariana Costa (Orçamento #orcamento-uuid-123) após envio do orçamento.',
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
      'Falha de timeout na conexão com o banco de dados',
    )
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getValorTotalGeral: () => 500.0,
      },
    } as unknown as OrcamentoEnviadoEvent

    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha no processo automático pós-envio do orçamento (Orçamento ID: orcamento-uuid-123)',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})