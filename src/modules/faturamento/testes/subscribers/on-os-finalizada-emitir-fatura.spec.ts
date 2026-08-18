import { OnOrdemServicoFinalizadaEmitirFatura } from '../../application/subscribers/on-os-finalizada-emitir-fatura.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSExecucaoFinalizadaEvent } from '@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js'
import { EmitirFaturaUseCase } from '../../application/use-cases/emitir-fatura.js'
import { InMemoryOrcamentoGateway } from '../gateways/in-memory-orcamento-gateway.js'
import { Logger } from '@nestjs/common'

describe('OnOrdemServicoFinalizadaEmitirFatura (Subscriber)', () => {
  let subscriber: OnOrdemServicoFinalizadaEmitirFatura
  let emitirFatura: EmitirFaturaUseCase
  let orcamentoGateway: InMemoryOrcamentoGateway
  let handler: (event: any) => void | Promise<void>

  beforeEach(() => {
    vi.clearAllMocks()

    const registerSpy = vi.spyOn(DomainEvents, 'register')

    // Mock com estrutura do Either (Right por padrão)
    emitirFatura = {
      execute: vi.fn().mockResolvedValue({
        isLeft: () => false,
        isRight: () => true,
        value: {
          getId: () => ({ toValue: () => 'fatura-uuid-789' }),
        },
      }),
    } as unknown as EmitirFaturaUseCase

    orcamentoGateway = {
      obterValorAprovadoPorOrdemServicoId: vi.fn().mockResolvedValue({
        valorTotal: 1500,
        orcamentoId: 'orcamento-uuid-123',
      }),
    } as unknown as InMemoryOrcamentoGateway

    // Instancia o subscriber (o construtor chama setupSubscriptions automaticamente)
    subscriber = new OnOrdemServicoFinalizadaEmitirFatura(
      emitirFatura,
      orcamentoGateway,
    )

    // Captura a referência da função do subscriber antes de futuros mocks
    handler = registerSpy.mock.calls[0][0]
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrdemServicoFinalizadaEmitirFatura(emitirFatura, orcamentoGateway)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSExecucaoFinalizadaEvent.name,
    )
  })

  it('deve buscar o orçamento aprovado e emitir a fatura com sucesso ao processar o evento', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await handler(mockEvent)

    expect(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).toHaveBeenCalledWith('os-uuid-456')
    expect(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).toHaveBeenCalledTimes(1)

    expect(emitirFatura.execute).toHaveBeenCalledWith({
      orcamentoId: 'orcamento-uuid-123',
      valorTotal: 1500,
    })
    expect(emitirFatura.execute).toHaveBeenCalledTimes(1)

    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Fatura emitida com sucesso para a OS os-uuid-456. ID Fatura: fatura-uuid-789',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar o retorno Left (falha de negócio) do Use Case sem lançar exceção', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    // Simula retorno Left (Right=false) do Either no Use Case
    const erroNegocio = new Error('Orçamento com status inválido para faturamento')
    vi.mocked(emitirFatura.execute).mockResolvedValueOnce({
      isLeft: () => true,
      isRight: () => false,
      value: erroNegocio,
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await handler(mockEvent)

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Left Error]: Não foi possível emitir a fatura para a OS os-uuid-456.',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções de infraestrutura (catch) lançadas pelo Gateway sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const erroConexao = new Error('Erro de conexão com o banco de dados')
    vi.mocked(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).mockRejectedValueOnce(erroConexao)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await expect(async () => handler(mockEvent)).not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `[Subscriber Exception]: Erro inesperado ao processar evento de emissão de fatura para a OS os-uuid-456`,
      erroConexao.stack,
    )

    loggerErrorSpy.mockRestore()
  })
})