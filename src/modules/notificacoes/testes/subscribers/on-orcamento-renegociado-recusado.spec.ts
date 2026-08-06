import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OSEncerradaPorRejeicaoEvent } from '../../../os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { OnOrcamentoRenegociadoRecusado } from '../../application/subscribers/on-orcamento-renegociado-recusado.js'

describe('OnOrcamentoRenegociadoRecusado (Subscriber)', () => {
  let criarNotificacao: CriarNotificacaoUseCase
  let subscriber: OnOrcamentoRenegociadoRecusado

  beforeEach(() => {
    vi.clearAllMocks()

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    vi.spyOn(DomainEvents, 'register')

    subscriber = new OnOrcamentoRenegociadoRecusado(criarNotificacao)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRenegociadoRecusado(criarNotificacao)

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

    // Valida se o Use Case foi chamado com a nova estrutura de DTO
    expect(criarNotificacao.execute).toHaveBeenCalledWith({
      destinatarioId: 'gerencia@oficina.com',
      conteudo:
        'O orçamento da OS #os-uuid-123 foi REJEITADO DEFINITIVAMENTE pelo cliente após tentativas de renegociação. O processo foi encerrado.',
      titulo: 'Orcamento renegociado recusado',
      template: 'orcamento-renegociado-recusado',
    })

    // Valida o log de informação
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
    vi.mocked(criarNotificacao.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      ordemServico: {
        getId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OSEncerradaPorRejeicaoEvent

    await expect(handler(mockEvent)).resolves.not.toThrow()

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao enviar notificação sobre a recusa definitiva do orçamento da OS #os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})