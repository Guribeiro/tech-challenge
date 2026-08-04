import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { DiagnosticoConcluidoEvent } from '../../domain/events/diagnostico-concluido-event.js'
import { GerarOrcamentoUseCase } from '../../application/use-cases/orcamento/gerar-orcamento.js'
import { OnDiagnosticoConcluido } from '../../application/subscribers/on-diagnostico-concluido.js'

describe('OnDiagnosticoConcluido (Subscriber)', () => {
  let gerarOrcamento: GerarOrcamentoUseCase
  let subscriber: OnDiagnosticoConcluido

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de geração de orçamento
    gerarOrcamento = {
      execute: vi.fn(),
    } as unknown as GerarOrcamentoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que registra a assinatura no construtor)
    subscriber = new OnDiagnosticoConcluido(gerarOrcamento)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnDiagnosticoConcluido(gerarOrcamento)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      DiagnosticoConcluidoEvent.name,
    )
  })

  it('deve extrair os dados da OS e executar o GerarOrcamentoUseCase com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mocks dos coleções/objetos internos da Ordem de Serviço
    const mockServicos = [
      { id: 'servico-1', nome: 'Troca de Óleo' },
      { id: 'servico-2', nome: 'Alinhamento' },
    ]
    const mockComponentes = [
      { id: 'comp-1', nome: 'Filtro de Óleo' },
    ]

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getClienteId: () => ({ toValue: () => 'cliente-uuid-456' }),
        getServicos: () => ({ getItems: () => mockServicos }),
        getComponentes: () => ({ getItems: () => mockComponentes }),
      },
    } as unknown as DiagnosticoConcluidoEvent

    await handler(mockEvent)

    // Valida se o Use Case de geração de orçamento recebeu todos os parâmetros mapeados corretamente
    expect(gerarOrcamento.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-123',
      clienteId: 'cliente-uuid-456',
      servicos: mockServicos,
      componentes: mockComponentes,
    })

    // Valida se o log de sucesso foi emitido
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: Orçamento gerado automaticamente para a OS os-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar falhas na geração do orçamento (catch) e registrar log de erro sem interromper a execução', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de persistência de banco de dados ao salvar orçamento')
    vi.mocked(gerarOrcamento.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
        getClienteId: () => ({ toValue: () => 'cliente-uuid-456' }),
        getServicos: () => ({ getItems: () => [] }),
        getComponentes: () => ({ getItems: () => [] }),
      },
    } as unknown as DiagnosticoConcluidoEvent

    // Garante que o subscriber absorve o erro sem lançar exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o log de erro foi devidamente chamado com a exception
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao gerar orçamento automático para a OS os-uuid-123.',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})