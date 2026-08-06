import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-recusado-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { OnOrcamentoRecusado } from '../../application/subscribers/on-orcamento-recusado.js'

describe('OnOrcamentoRecusado (Subscriber)', () => {
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnOrcamentoRecusado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de notificação
    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber que se auto-registra no construtor
    subscriber = new OnOrcamentoRecusado(criarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRecusado(criarNotificacao)

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

    // Valida se o Use Case de notificação foi acionado com o DTO correto
    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'recepcao@oficina.com',
      conteudo:
        'Atenção! O cliente recusou o orçamento original da OS #os-uuid-456. Inicie o processo de renegociação.',
      titulo: 'Orcamento recusado',
      template: 'orcamento-recusado',
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
    vi.mocked(criarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

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