import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSExecucaoFinalizadaEvent } from '@/modules/os-orcamento/domain/events/os-execucao-finalizada-event.js'
import { DeduzirEstoqueUseCase } from '../../application/use-cases/deduzir-estoque.js'
import { OnOrdemServicoFinalizadaDeduzirEstoque } from '../../application/subscribers/on-os-finalizada-deduzir-estoque.js'

describe('OnOrdemServicoFinalizadaDeduzirEstoque (Subscriber)', () => {
  let deduzirEstoque: DeduzirEstoqueUseCase
  let subscriber: OnOrdemServicoFinalizadaDeduzirEstoque

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case
    deduzirEstoque = {
      execute: vi.fn(),
    } as unknown as DeduzirEstoqueUseCase

    // 2. Espia o registro do evento ANTES da instanciação no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnOrdemServicoFinalizadaDeduzirEstoque(deduzirEstoque)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrdemServicoFinalizadaDeduzirEstoque(deduzirEstoque)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSExecucaoFinalizadaEvent.name,
    )
  })

  it('deve logar mensagem e encerrar a execução caso a OS não possua produtos/componentes a deduzir', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock de evento onde a OS não possui componentes
    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({
          getItems: () => [],
        }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await handler(mockEvent)

    // Valida se o log informativo foi gerado
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Info]: OS os-uuid-123 finalizada sem produtos a deduzir.',
    )

    // Garante que o use case NÃO foi executado
    expect(deduzirEstoque.execute).not.toHaveBeenCalled()

    loggerLogSpy.mockRestore()
  })

  it('deve deduzir o estoque dos componentes da OS com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula resposta Right (sucesso) do Use Case
    vi.mocked(deduzirEstoque.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: undefined,
    } as any)

    // Mock de evento com itens/componentes
    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({
          getItems: () => [
            {
              getProdutoId: () => ({ toValue: () => 'produto-uuid-01' }),
              getQuantidade: () => 2,
            },
            {
              getProdutoId: () => ({ toValue: () => 'produto-uuid-02' }),
              getQuantidade: () => 1,
            },
          ],
        }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await handler(mockEvent)

    // Valida se o Use Case foi chamado mapeando corretamente os itens
    expect(deduzirEstoque.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-123',
      itens: [
        { produtoId: 'produto-uuid-01', quantidade: 2 },
        { produtoId: 'produto-uuid-02', quantidade: 1 },
      ],
    })

    // Valida o log de sucesso conforme texto da classe
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: Orçamento gerado automaticamente para a OS os-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroNegocio = new Error('Estoque insuficiente para o produto produto-uuid-01')

    // Simula retorno Left
    vi.mocked(deduzirEstoque.execute).mockResolvedValueOnce({
      isLeft: () => true,
      isRight: () => false,
      value: erroNegocio,
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({
          getItems: () => [
            {
              getProdutoId: () => ({ toValue: () => 'produto-uuid-01' }),
              getQuantidade: () => 10,
            },
          ],
        }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    await handler(mockEvent)

    // Valida o log de aviso (warn)
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Left Error]: Falha ao deduzir estoque para a OS os-uuid-123. Erro: Estoque insuficiente para o produto produto-uuid-01',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de conexão com o banco de dados')
    vi.mocked(deduzirEstoque.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({
          getItems: () => [
            {
              getProdutoId: () => ({ toValue: () => 'produto-uuid-01' }),
              getQuantidade: () => 1,
            },
          ],
        }),
      },
    } as unknown as OSExecucaoFinalizadaEvent

    // Garante que o handler resolve sem estourar a exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log do bloco catch exatamente como configurado na classe
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao gerar orçamento automático para a OS os-uuid-123.',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})