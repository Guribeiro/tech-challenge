import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSEncerradaEvent } from '@/modules/os-orcamento/domain/events/os-encerrada-event.js'
import { EmitirTermoLiberacaoUseCase } from '../../application/use-cases/emitir-termo-liberacao.js'
import { OnOrdemServicoEncerrada } from '../../application/subscribers/on-os-encerrada.js'

describe('OnOrdemServicoEncerrada (Subscriber)', () => {
  let emitirTermoLiberacao: EmitirTermoLiberacaoUseCase
  let subscriber: OnOrdemServicoEncerrada

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case
    emitirTermoLiberacao = {
      execute: vi.fn(),
    } as unknown as EmitirTermoLiberacaoUseCase

    // 2. Espia o registro do evento ANTES da instanciação no beforeEach
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que registra a assinatura no construtor
    subscriber = new OnOrdemServicoEncerrada(emitirTermoLiberacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrdemServicoEncerrada(emitirTermoLiberacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSEncerradaEvent.name,
    )
  })

  it('deve emitir o termo de liberação com sucesso ao encerrar a OS', async () => {
    // Espia o log de sucesso do NestJS
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Mock do objeto Termo retornado no caso de uso
    const mockTermo = {
      getId: () => ({ toValue: () => 'termo-uuid-456' }),
    }

    // Simula resposta Right (sucesso) do Use Case
    vi.mocked(emitirTermoLiberacao.execute).mockResolvedValueOnce({
      isLeft: () => false,
      isRight: () => true,
      value: { termo: mockTermo },
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-100' }),
      },
    } as unknown as OSEncerradaEvent

    await handler(mockEvent)

    // Valida a chamada do Use Case com o parâmetro correto
    expect(emitirTermoLiberacao.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-100',
    })

    // Valida a mensagem exata gravada no log
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Termo de liberação emitido com sucesso para a OS #os-uuid-100. Termo ID: termo-uuid-456',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar e logar aviso (warn) caso o UseCase retorne Left (falha de negócio)', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroNegocio = new Error('OS não está em estado válido para liberação')

    // Simula resposta Left (erro de negócio)
    vi.mocked(emitirTermoLiberacao.execute).mockResolvedValueOnce({
      isLeft: () => true,
      isRight: () => false,
      value: erroNegocio,
    } as any)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-100' }),
      },
    } as unknown as OSEncerradaEvent

    await handler(mockEvent)

    // Valida a mensagem de aviso (warn) com a mensagem de erro formatada
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Falha ao emitir termo de liberação para a OS #os-uuid-100. Erro: OS não está em estado válido para liberação',
    )

    loggerWarnSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar no console sem lançar exceção', async () => {
    // Espia o console.error utilizado no bloco catch desta classe
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro ao conectar com o serviço de PDF')
    vi.mocked(emitirTermoLiberacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-100' }),
      },
    } as unknown as OSEncerradaEvent

    // Garante que o handler resolve sem estourar a exceção
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a chamada do console.error no bloco catch
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Falha no processo automático pós-encerramento da OS #os-uuid-100',
      erroInesperado,
    )

    consoleErrorSpy.mockRestore()
  })
})