import { Logger } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { OrcamentoEnviadoEvent } from '@/modules/os-orcamento/domain/events/orcamento-enviado-event.js'
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteOrcamentoGateway } from '../../application/gateways/cliente-orcamento-gateway.js'
import { OnOrcamentoEnviado } from '../../application/subscribers/on-orcamento-enviado.js'

describe('OnOrcamentoEnviado (Subscriber)', () => {
  let clienteOrcamentoGateway: ClienteOrcamentoGateway
  let enviarNotificacao: EnviarNotificacaoUseCase
  let subscriber: OnOrcamentoEnviado

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Mocks das dependências
    clienteOrcamentoGateway = {
      obterDadosNotificacaoPorOrcamentoId: vi.fn(),
    } as unknown as ClienteOrcamentoGateway

    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as EnviarNotificacaoUseCase

    // 2. Espia o registro do evento ANTES da instanciação
    vi.spyOn(DomainEvents, 'register')

    // 3. Instancia a classe que assina o evento no construtor
    subscriber = new OnOrcamentoEnviado(
      clienteOrcamentoGateway,
      enviarNotificacao,
    )
  })

  it('deve registrar a assinatura do evento no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnOrcamentoEnviado(clienteOrcamentoGateway, enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      OrcamentoEnviadoEvent.name,
    )
  })

  it('deve logar aviso (warn) e encerrar a execução caso os dados do cliente não sejam encontrados no gateway', async () => {
    const loggerWarnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Gateway retorna null indicando cliente não encontrado
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce(null)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getValorTotalGeral: () => 1500.0,
      },
    } as unknown as OrcamentoEnviadoEvent

    await handler(mockEvent)

    // Valida se o gateway foi consultado com o ID do orçamento
    expect(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).toHaveBeenCalledWith('orcamento-uuid-123')

    // Valida se o aviso (warn) foi disparado
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '[Subscriber Warning]: Não foi possível obter os dados do cliente para notificação da fatura emitida (Orçamento ID: orcamento-uuid-123).',
    )

    // Garante que a notificação NÃO foi enviada
    expect(enviarNotificacao.execute).not.toHaveBeenCalled()

    loggerWarnSpy.mockRestore()
  })

  it('deve buscar os dados do cliente e disparar a notificação com sucesso ao enviar o orçamento', async () => {
    const loggerLogSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    // Simula retorno dos dados do cliente pelo gateway
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockResolvedValueOnce({
      nome: 'Mariana Costa',
      telefone: '11977776666',
      ordemServicoId: 'os-uuid-456',
    })

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getValorTotalGeral: () => 1250.75,
      },
    } as unknown as OrcamentoEnviadoEvent

    await handler(mockEvent)

    // Valida se o Use Case de envio de notificação foi acionado com o template correto
    expect(enviarNotificacao.execute).toHaveBeenCalledWith({
      destinatario: '11977776666',
      mensagem: 'Olá Mariana Costa! O orçamento ficou em R$ 1250.75.',
    })

    // Valida o log de sucesso
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Notificação enviada com sucesso para o cliente Mariana Costa (Orçamento #orcamento-uuid-123) após envio do orçamento.',
    )

    loggerLogSpy.mockRestore()
  })

  it('deve capturar exceções não tratadas (catch) e logar erro no Logger sem lançar exceção', async () => {
    const loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => { })

    const registerSpy = vi.spyOn(DomainEvents, 'register')
    const handler = registerSpy.mock.calls[0][0]

    const erroInesperado = new Error('Falha de timeout na conexão com o banco de dados')
    vi.mocked(
      clienteOrcamentoGateway.obterDadosNotificacaoPorOrcamentoId,
    ).mockRejectedValueOnce(erroInesperado)

    const mockEvent = {
      orcamento: {
        getId: () => ({ toValue: () => 'orcamento-uuid-123' }),
        getValorTotalGeral: () => 500.0,
      },
    } as unknown as OrcamentoEnviadoEvent

    // Garante resiliência: a exceção não é repassada adiante
    await expect(handler(mockEvent)).resolves.not.toThrow()

    // Valida a mensagem gravada no log de erro
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      '[Subscriber Error]: Falha no processo automático pós-envio do orçamento (Orçamento ID: orcamento-uuid-123)',
      erroInesperado,
    )

    loggerErrorSpy.mockRestore()
  })
})