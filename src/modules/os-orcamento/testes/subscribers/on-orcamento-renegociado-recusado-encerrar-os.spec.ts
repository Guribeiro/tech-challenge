import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoRenegociadoRecusadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-renegociado-recusado-event.js'
import { EncerrarOrdemServicoUseCase } from '../../application/use-cases/ordens-servicos/encerrar-os-por-rejeicao.js'
import { OnOrcamentoRenegociadoRecusadoEncerrarOS } from '../../application/subscribers/on-orcamento-renegociado-recusado-encerrar-os.js'

describe('OnOrcamentoRenegociadoRecusadoEncerrarOS (Subscriber)', () => {
  let encerrarOrdemServico: EncerrarOrdemServicoUseCase
  let subscriber: OnOrcamentoRenegociadoRecusadoEncerrarOS

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mock do Use Case de encerramento de OS
    encerrarOrdemServico = {
      execute: vi.fn(),
    } as unknown as EncerrarOrdemServicoUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que auto-registra a assinatura no construtor)
    subscriber = new OnOrcamentoRenegociadoRecusadoEncerrarOS(encerrarOrdemServico)
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoRenegociadoRecusadoEncerrarOS(encerrarOrdemServico)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoRenegociadoRecusadoEvent.name,
    )
  })

  it('deve extrair o id da OS e executar o EncerrarOrdemServicoUseCase com sucesso', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const mockEvent = {
      orcamento: {
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoRecusadoEvent

    await handler(mockEvent)

    // Valida se o Use Case de encerramento foi acionado com o ID correto da OS
    expect(encerrarOrdemServico.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-123',
    })

    // Valida se o log de sucesso foi emitido
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[Subscriber Success]: OS os-uuid-123 encerrada devido à recusa do orçamento renegociado.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar falhas ao encerrar a OS (catch) e registrar log de erro sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Erro ao atualizar status da ordem de serviço no repositório')
    vi.mocked(encerrarOrdemServico.execute).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getOrdemServicoId: () => ({ toValue: () => 'os-uuid-123' }),
      },
    } as unknown as OrcamentoRenegociadoRecusadoEvent

    // Garante que a exceção é absorvida pelo subscriber sem derrubar a aplicação
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida se o erro foi registrado com a mensagem e exceção esperadas
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao encerrar OS os-uuid-123',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})