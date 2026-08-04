import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoAprovadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-aprovado-event.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js'
import { OnClienteAprovouOrcamento } from '../../application/subscribers/on-orcamento-aprovado.js'

describe('OnClienteAprovouOrcamento (Subscriber)', () => {
  let ordemServicoRepository: OrdemServicoRepository
  let subscriber: OnClienteAprovouOrcamento

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do repositório da Ordem de Serviço
    ordemServicoRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as OrdemServicoRepository

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que auto-registra a assinatura no construtor)
    subscriber = new OnClienteAprovouOrcamento(ordemServicoRepository)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnClienteAprovouOrcamento(ordemServicoRepository)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoAprovadoEvent.name,
    )
  })

  it('deve logar erro (error) e interromper a execução se a ordem de serviço não for encontrada', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Repositório retorna null indicando que a OS não existe
    vi.mocked(ordemServicoRepository.findById).mockResolvedValueOnce(null)

    const mockEvent = {
      orcamento: {
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OrcamentoAprovadoEvent

    await handler(mockEvent)

    // Valida se o repositório foi consultado com o ID extraído
    expect(ordemServicoRepository.findById).toHaveBeenCalledWith('os-uuid-123')

    // Valida o log de erro para OS não encontrada
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Ordem de serviço associada os-uuid-123 não foi encontrada.',
    )

    // Confirma que a tentativa de salvar NÃO ocorreu
    expect(ordemServicoRepository.save).not.toHaveBeenCalled()

    loggerErrorSpy.mockRestore()
  })

  it('deve buscar a OS, autorizar a execução no modelo de domínio, salvar e registrar log de sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Objeto mock que simula a entidade de domínio OrdemServico
    const mockOrdemServico = {
      autorizaExecucao: vi.fn(),
    }

    vi.mocked(ordemServicoRepository.findById).mockResolvedValueOnce(
      mockOrdemServico as any,
    )

    const mockEvent = {
      orcamento: {
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OrcamentoAprovadoEvent

    await handler(mockEvent)

    // 1. Consulta OS
    expect(ordemServicoRepository.findById).toHaveBeenCalledWith('os-uuid-123')

    // 2. Transição de estado de domínio
    expect(mockOrdemServico.autorizaExecucao).toHaveBeenCalled()

    // 3. Persistência
    expect(ordemServicoRepository.save).toHaveBeenCalledWith(mockOrdemServico)

    // 4. Log de confirmação
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: Status da OS os-uuid-123 atualizado para EM_EXECUCAO devido à aprovação do orçamento.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e registrar log de erro sem interromper a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de conexão/timeout com o banco de dados')
    vi.mocked(ordemServicoRepository.findById).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OrcamentoAprovadoEvent

    // Confirma resiliência: a exceção é absorvida pelo subscriber
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a mensagem e a exceção no log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao atualizar OS os-uuid-123 após aprovação do orçamento.',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})