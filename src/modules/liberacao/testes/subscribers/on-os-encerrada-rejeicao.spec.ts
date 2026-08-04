import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSEncerradaPorRejeicaoEvent } from '@/modules/os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EmitirTermoRejeicaoUseCase } from '../../application/use-cases/emitir-termo-liberacao-rejeicao.js'
import { OnOrdemServicoEncerradaPorRejeicao } from '../../application/subscribers/on-os-encerrada-por-rejeicao.js'

describe('OnOrdemServicoEncerradaPorRejeicao (Subscriber)', () => {
  let emitirTermoRejeicao: EmitirTermoRejeicaoUseCase
  let subscriber: OnOrdemServicoEncerradaPorRejeicao

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case
    emitirTermoRejeicao = {
      execute: vi.fn(),
    } as unknown as EmitirTermoRejeicaoUseCase

    // 2. Espia o registro do evento ANTES da instanciação no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnOrdemServicoEncerradaPorRejeicao(emitirTermoRejeicao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrdemServicoEncerradaPorRejeicao(emitirTermoRejeicao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSEncerradaPorRejeicaoEvent.name,
    )
  })

  it('deve emitir o termo de liberação por rejeição com sucesso ao finalizar a OS', async () => {
    // Espia o log do NestJS
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock do objeto Termo retornado no caso de uso
    const mockTermo = {
      getId: () => ({ toValue: () => 'termo-uuid-123' }),
    }

    // Simula resposta Right (sucesso) do Use Case
    vi.mocked(emitirTermoRejeicao.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: { termo: mockTermo },
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-999' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    await handler(mockEvent)

    // Valida a execução do Use Case com o parâmetro correto
    expect(emitirTermoRejeicao.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-999',
    })

    // Valida o log de sucesso formatado
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Termo de liberação por rejeição emitido com sucesso para a OS #os-uuid-999. Termo ID: termo-uuid-123',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroNegocio = new Error('A OS informada não está pendente de rejeição')

    // Simula resposta Left (erro de negócio)
    vi.mocked(emitirTermoRejeicao.execute).mockResolvedValueOnce({
      isLeft: () => true,
      isRight: () => false,
      value: erroNegocio,
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-999' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    await handler(mockEvent)

    // Valida se o aviso (warn) foi disparado com a mensagem de erro
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Falha ao emitir termo de liberação por rejeição para a OS #os-uuid-999. Erro: A OS informada não está pendente de rejeição',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha no serviço de geração de PDFs')
    vi.mocked(emitirTermoRejeicao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-999' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    // Garante que o handler resolve sem estourar a exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log do bloco catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Falha no processo automático pós-encerramento da OS #os-uuid-999',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})