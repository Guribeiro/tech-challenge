import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'
import { ClienteOrcamentoGateway } from '@/modules/os-orcamento/application/gateways/cliente-orcamento-gateway.js'
import { EncerrarOrdemServicoFaturaPagaUseCase } from '../../application/use-cases/ordens-servicos/encerrar-os-fatura-paga.js'
import { OnFaturaPagaEncerrarOrdemServico } from '../../application/subscribers/on-fatura-paga-encerrar-os.js'

describe('OnFaturaPagaEncerrarOrdemServico (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let encerrarOrdemServicoFaturaPaga: EncerrarOrdemServicoFaturaPagaUseCase
  let subscriber: OnFaturaPagaEncerrarOrdemServico

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências
    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    encerrarOrdemServicoFaturaPaga = {
      execute: vi.fn(),
    } as unknown as EncerrarOrdemServicoFaturaPagaUseCase

    // 2. Espia o registro do evento no DomainEvents ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia o subscriber (que registra a assinatura no construtor)
    subscriber = new OnFaturaPagaEncerrarOrdemServico(
      clienteOrcamentoGateway,
      encerrarOrdemServicoFaturaPaga,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnFaturaPagaEncerrarOrdemServico(
      clienteOrcamentoGateway,
      encerrarOrdemServicoFaturaPaga,
    )

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      FaturaPagaEvent.name,
    )
  })

  it('deve logar erro (error) e não encerrar a OS se os dados do cliente não forem encontrados', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Gateway retorna null para indicar que não encontrou o cliente/orcamento
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      fatura: {
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as FaturaPagaEvent

    await handler(mockEvent)

    // Valida a consulta ao gateway com o ID do orçamento
    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-123')

    // Valida se o erro lançado internamente foi capturado e logado no catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao encerrar a OS após o pagamento da fatura.',
      new Error('Dados do cliente não encontrados para o Orçamento #orcamento-uuid-123.'),
    )

    // Garante que o caso de uso de encerramento da OS NÃO foi executado
    expect(encerrarOrdemServicoFaturaPaga.execute).not.toHaveBeenCalled()

    loggerErrorSpy.mockRestore()
  })

  it('deve obter a OS associada ao orçamento e executar o encerramento com sucesso após o pagamento', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno positivo do gateway contendo o ID da OS
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      ordemServicoId: 'os-uuid-456',
      nome: 'Cliente Exemplo',
      telefone: '11999998888',
    })

    const mockEvent = {
      fatura: {
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as FaturaPagaEvent

    await handler(mockEvent)

    // Valida se o Use Case de encerramento foi chamado com o ID da OS correto
    expect(encerrarOrdemServicoFaturaPaga.execute).toHaveBeenCalledWith({
      ordemServicoId: 'os-uuid-456',
    })

    // Valida o log de sucesso
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '[OS-Core]: Ordem de Serviço #os-uuid-456 foi ENCERRADA automaticamente após a confirmação do pagamento.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar falhas na execução do caso de uso (catch) e registrar log sem estourar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      ordemServicoId: 'os-uuid-456',
      nome: 'Cliente Exemplo',
      telefone: '11999998888',
    })

    const erroCasoDeUso = new Error('Erro de concorrência ou transação de banco de dados')
    vi.mocked(encerrarOrdemServicoFaturaPaga.execute).mockRejectedValueOnce(
      erroCasoDeUso,
    )

    const mockEvent = {
      fatura: {
        getOrcamentoId: () => ({ toValue: () => 'orcamento-uuid-123' }),
      },
    } as unknown as FaturaPagaEvent

    // Garante que o handler captura e absorve o erro sem lançar para fora
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida o log de erro no catch
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha ao encerrar a OS após o pagamento da fatura.',
      erroCasoDeUso,
    )

    loggerErrorSpy.mockRestore()
  })
})