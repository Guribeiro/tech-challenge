import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { EnviarNotificacaoUseCase } from '../../domain/use-cases/enviar-notificacao.js'
import { OnOrcamentoRenegociadoRecusado } from '../../application/subscribers/on-orcamento-renegociado-recusado.js'

describe('OnOrcamentoRenegociadoRecusado (Subscriber)', () => {
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnOrcamentoRenegociadoRecusado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de notificação
    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que se auto-registra no construtor
    subscriber = new OnOrcamentoRenegociadoRecusado(enviarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRenegociadoRecusado(enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OSEncerradaPorRejeicaoEvent.name,
    )
  })

  it('deve enviar notificação para a gerência sobre a recusa definitiva do orçamento com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    await handler(mockEvent)

    // Valida se a notificação foi enviada para o e-mail da gerência com a mensagem formatada
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: 'gerencia@oficina.com',
      mensagem:
        'O orçamento da OS #os-uuid-123 foi REJEITADO DEFINITIVAMENTE pelo cliente após tentativas de renegociação. O processo foi encerrado.',
    })

    // Valida se o log de informação foi gerado
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Notificação enviada para a gerência sobre a recusa definitiva do orçamento da OS #os-uuid-123.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de envio no provedor de e-mail')
    vi.mocked(enviarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    // Confirma resiliência: o subscriber absorve o erro sem quebrar o fluxo
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o log de erro foi gravado no bloco catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao enviar notificação sobre a recusa definitiva do orçamento da OS #os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})