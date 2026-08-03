import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { ProdutosReservadosNoEstoqueEvent } from '@/modules/estoque/domain/events/produtos-reservados-no-estoque-event.js'
import { OrdemServicoRepository } from '../../domain/repositories/ordem-servico-repository.js'
import { OnProdutosReservados } from '../../application/subscribers/on-produtos-reservados.js'

describe('OnProdutosReservados (Subscriber)', () => {
  let ordemServicoRepository: OrdemServicoRepository
  let subscriber: OnProdutosReservados

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do repositório da Ordem de Serviço
    ordemServicoRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as OrdemServicoRepository

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que registra a assinatura no construtor)
    subscriber = new OnProdutosReservados(ordemServicoRepository)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnProdutosReservados(ordemServicoRepository)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      ProdutosReservadosNoEstoqueEvent.name,
    )
  })

  it('deve logar erro (error) e interromper a execução se a Ordem de Serviço não for encontrada', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Repositório retorna null para simular OS inexistente no banco
    vi.mocked(ordemServicoRepository.findById).mockResolvedValueOnce(null)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as ProdutosReservadosNoEstoqueEvent

    await handler(mockEvent)

    // Valida se o repositório foi consultado com o ID extraído do evento
    expect(ordemServicoRepository.findById).toHaveBeenCalledWith('os-uuid-123')

    // Valida o log de erro para OS não encontrada
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Ordem de Serviço os-uuid-123 não foi encontrada para atualização de prontidão.',
    )

    // Garante que o método save do repositório NÃO foi chamado
    expect(ordemServicoRepository.save).not.toHaveBeenCalled()

    loggerErrorSpy.mockRestore()
  })

  it('deve buscar a OS, alterar o status para pronta para iniciar, salvar e registrar log de sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock da entidade de domínio OrdemServico
    const mockOrdemServico = {
      marcarComoProntaParaIniciar: vi.fn(),
    }

    vi.mocked(ordemServicoRepository.findById).mockResolvedValueOnce(
      mockOrdemServico as any,
    )

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as ProdutosReservadosNoEstoqueEvent

    await handler(mockEvent)

    // 1. Consulta OS
    expect(ordemServicoRepository.findById).toHaveBeenCalledWith('os-uuid-123')

    // 2. Executa a transição de status no domínio
    expect(mockOrdemServico.marcarComoProntaParaIniciar).toHaveBeenCalled()

    // 3. Salva a entidade atualizada
    expect(ordemServicoRepository.save).toHaveBeenCalledWith(mockOrdemServico)

    // 4. Log de confirmação
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: OS os-uuid-123 atualizada com sucesso para PRONTA_PARA_INICIAR.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e registrar log de erro sem interromper a aplicação', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de conexão com o banco de dados')
    vi.mocked(ordemServicoRepository.findById).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServicoId: {
        toValue: () => 'os-uuid-123',
      },
    } as unknown as ProdutosReservadosNoEstoqueEvent

    // Confirma resiliência: a exceção é absorvida sem quebrar o barramento de eventos
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a mensagem e a exceção no log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao atualizar a OS os-uuid-123 para pronta.',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})