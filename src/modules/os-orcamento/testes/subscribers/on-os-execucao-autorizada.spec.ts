import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSExecucaoAutorizadaEvent } from '../../domain/events/os-execucao-autorizada-event.js'
import { ReservarProdutosEstoqueUseCase } from '@/modules/estoque/application/use-cases/reservar-produtos-estoque.js'
import { OnExecucaoAutorizada } from '../../application/subscribers/on-os-execucao-autorizada.js'

describe('OnExecucaoAutorizada (Subscriber)', () => {
  let reservarPecas: ReservarProdutosEstoqueUseCase
  let subscriber: OnExecucaoAutorizada

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case do módulo de Estoque
    reservarPecas = {
      execute: vi.fn(),
    } as unknown as ReservarProdutosEstoqueUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que se auto-registra no construtor)
    subscriber = new OnExecucaoAutorizada(reservarPecas)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnExecucaoAutorizada(reservarPecas)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSExecucaoAutorizadaEvent.name,
    )
  })

  it('deve logar mensagem informativa e encerrar antecipadamente caso a OS não possua peças/componentes para reservar', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({ getItems: () => [] }), // Lista vazia de componentes
      },
    } as unknown as OSExecucaoAutorizadaEvent

    await handler(mockEvent)

    // Valida se o log de informação foi emitido informando que não há peças
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Info]: OS os-uuid-123 autorizada sem peças para reservar.',
    )

    // Garante que o Use Case de reserva de estoque NÃO foi acionado
    expect(reservarPecas.execute).not.toHaveBeenCalled()

    loggerLogSpy.mockRestore()
  })

  it('deve mapear os componentes da OS e solicitar a reserva de peças no estoque com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mocks dos componentes com Value Objects e métodos getter esperados
    const mockComponentes = [
      {
        getProdutoId: () => ({ toValue: () => 'produto-uuid-1' }),
        getQuantidade: () => 2,
      },
      {
        getProdutoId: () => ({ toValue: () => 'produto-uuid-2' }),
        getQuantidade: () => 5,
      },
    ]

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({ getItems: () => mockComponentes }),
      },
    } as unknown as OSExecucaoAutorizadaEvent

    await handler(mockEvent)

    // Valida se o Use Case de estoque recebeu a OS e a lista de itens mapeada corretamente
    expect(reservarPecas.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-123',
      itens: [
        { produtoId: 'produto-uuid-1', quantidade: 2 },
        { produtoId: 'produto-uuid-2', quantidade: 5 },
      ],
    })

    // Valida se o log de sucesso foi registrado
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: Comando de reserva enviado ao Inventário para a OS os-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar erros ao solicitar a reserva (catch) e registrar log de erro sem interromper a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockComponentes = [
      {
        getProdutoId: () => ({ toValue: () => 'produto-uuid-1' }),
        getQuantidade: () => 1,
      },
    ]

    const erroEstoque = new Error('Estoque insuficiente para o produto especificado')
    vi.mocked(reservarPecas.execute).mockRejectedValueOnce(erroEstoque)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getComponentes: () => ({ getItems: () => mockComponentes }),
      },
    } as unknown as OSExecucaoAutorizadaEvent

    // Garante resiliência: o subscriber absorve o erro de infra/domínio
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o log de erro foi chamado com a exceção
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Erro ao solicitar reserva de peças para a OS os-uuid-123',
      erroEstoque,
    )

    loggerErrorSpy.mockRestore()
  })
})