import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { OnOrcamentoRecusado } from '../../application/subscribers/on-orcamento-recusado.js'

describe('OnOrcamentoRecusado (Subscriber)', () => {
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnOrcamentoRecusado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de notificação
    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que se auto-registra no construtor
    subscriber = new OnOrcamentoRecusado(enviarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRecusado(enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoRecusadoEvent.name,
    )
  })

  it('deve enviar notificação para a recepção sobre a recusa do orçamento com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OrcamentoRecusadoEvent

    await handler(mockEvent)

    // Valida se a mensagem foi disparada para o e-mail/destino fixo da recepção
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: 'recepcao@oficina.com',
      mensagem:
        'Atenção! O cliente recusou o orçamento original da OS #os-uuid-456. Inicie o processo de renegociação.',
    })

    // Valida o log de informação
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Notificação enviada para a recepção sobre a recusa do orçamento orcamento-uuid-123.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem interromper a execução', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro de integração com serviço de e-mail')
    vi.mocked(enviarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-456' }),
      },
    } as unknown as OrcamentoRecusadoEvent

    // Garante que o subscriber absorve o erro e não interrompe a aplicação
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Falha ao notificar recepção sobre a recusa do orçamento orcamento-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})