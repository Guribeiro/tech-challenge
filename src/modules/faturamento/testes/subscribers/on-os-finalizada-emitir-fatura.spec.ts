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

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(DomainEvents, 'register')

    emitirFatura = {
      execute: vi.fn().mockResolvedValue({}),
    } as unknown as EmitirFaturaUseCase

    orcamentoGateway = {
      obterValorAprovadoPorOrdemServicoId: vi.fn().mockResolvedValue({
        valorTotal: 1500,
        orcamentoId: 'orcamento-uuid-123',
      }),
    } as unknown as InMemoryOrcamentoGateway

    // 2. Instanciação direta do Subscriber (sem necessidade de subir o NestJS TestingModule)
    subscriber = new OnOrdemServicoFinalizadaEmitirFatura(
      emitirFatura,
      orcamentoGateway
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    new OnOrdemServicoFinalizadaEmitirFatura(emitirFatura, orcamentoGateway)
    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSExecucaoFinalizadaEvent.name
    )
  })

  it('deve buscar o orçamento aprovado e emitir a fatura com sucesso ao processar o evento', async () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')
    subscriber.setupSubscriptions()

    // Extrai o handler privado que foi passado para o DomainEvents.register
    const handler = registerSpy.mock.calls[0][0]

    // Stub do evento
    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    // Executa o handler diretamente
    await handler(mockEvent)

    // Asserções
    expect(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).toHaveBeenCalledWith('os-uuid-456')
    expect(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).toHaveBeenCalledTimes(1)

    expect(emitirFatura.execute).toHaveBeenCalledWith({
      orcamentoId: 'orcamento-uuid-123',
      valorTotal: 1500,
    })
    expect(emitirFatura.execute).toHaveBeenCalledTimes(1)
  })

  it('deve capturar o retorno Left (falha de negócio) do Use Case sem lançar exceção', async () => {
    // 1. Espia o Logger.warn do NestJS (usado no branch isLeft)
    const loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    subscriber.setupSubscriptions()
    const handler = registerSpy.mock.calls[0][0]

    // 2. Gateway responde com sucesso
    vi.mocked(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).mockResolvedValueOnce({
      orcamentoId: 'orcamento-uuid-123',
      valorTotal: 1500,
    })

    // 3. Simula retorno Left do Either no Use Case
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

    // 4. Garante que o handler resolve sem estourar exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // 5. Valida se o log de aviso (warn) foi chamado com o erro de negócio
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Subscriber Left Error]: Não foi possível emitir a fatura para a OS os-uuid-456')
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções de infraestrutura (catch) lançadas pelo Gateway sem lançar exceção', async () => {
    // 1. Espia o Logger.error do NestJS (usado no bloco catch)
    const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    subscriber.setupSubscriptions()
    const handler = registerSpy.mock.calls[0][0]

    // 2. Simula uma rejeição de Promise/Exceção no Gateway
    const erroConexao = new Error('Erro de conexão com o banco de dados')
    vi.mocked(orcamentoGateway.obterValorAprovadoPorOrdemServicoId).mockRejectedValueOnce(erroConexao)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    // 3. Garante que o handler resolve sem quebrar a aplicação
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // 4. Valida se o erro não tratado caiu no catch e gerou log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `[Subscriber Exception]: Erro inesperado ao processar evento de emissão de fatura para a OS os-uuid-456`,
      erroConexao.stack
    )

    loggerErrorSpy.mockRestore()
  })
})