import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { TermoLiberacao } from '@/modules/liberacao/domain/entities/termo-liberacao.js'
import { TermoLiberacaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-emitido-event.js'
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-por-rejeicao-emitido-event.js'
import { InMemoryClienteOrdemServicoGateway } from '@/modules/liberacao/testes/gateways/in-memory-cliente-ordem-servico-gateway.js'
import { CriarNotificacaoUseCase } from '@/modules/notificacoes/application/use-cases/criar-notificacao.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeCliente } from '@/modules/os-orcamento/testes/factories/make-cliente.js'
import { makeVeiculo } from '@/modules/os-orcamento/testes/factories/make-veiculo.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js'
import { OnTermoLiberacaoEmitido } from '../../application/subscribers/on-termo-liberacao-emitido.js'
import { makeUsuario } from '@/modules/autenticacao/testes/factories/make-usuario.js'
import { InMemoryUsuariosRepository } from '@/modules/autenticacao/testes/repositories/in-memory-users-repository.js'

describe('OnTermoLiberacaoEmitido (Subscriber)', () => {
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let usuarioRepository: InMemoryUsuariosRepository
  let enviarNotificacao: CriarNotificacaoUseCase
  let clienteOrdemServicoGateway: InMemoryClienteOrdemServicoGateway

  beforeEach(() => {
    vi.clearAllMocks()

    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    usuarioRepository = new InMemoryUsuariosRepository()
    enviarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    clienteOrdemServicoGateway = new InMemoryClienteOrdemServicoGateway(
      ordemServicoRepository,
      clienteRepository,
    )

    new OnTermoLiberacaoEmitido(
      clienteOrdemServicoGateway,
      enviarNotificacao,
    )
  })

  it('deve registrar as assinaturas dos eventos no DomainEvents ao instanciar a classe', () => {
    const registerSpy = vi.spyOn(DomainEvents, 'register')

    new OnTermoLiberacaoEmitido(clienteOrdemServicoGateway, enviarNotificacao)

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      TermoLiberacaoEmitidoEvent.name,
    )
    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(Function),
      TermoLiberacaoPorRejeicaoEmitidoEvent.name,
    )
  })

  it('deve chamar caso de uso CriarNotificacao quando motivo for PAGAMENTO_APROVADO', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const usuario = makeUsuario({}, cliente.getId())
    await usuarioRepository.create(usuario)

    const veiculo = makeVeiculo()
    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: new UniqueEntityID(),
      mecanicoId: new UniqueEntityID(),
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      descricao: 'descricao',
      eGarantia: false,
      prioridade,
    })
    await ordemServicoRepository.create(os)

    const termoLiberacao = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'PAGAMENTO_APROVADO',
    })

    const evento = new TermoLiberacaoEmitidoEvent(termoLiberacao)
    DomainEvents.dispatch(evento)

    const nome = cliente.getNome().getValor()

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalledWith({
        destinatarioId: cliente.getId().toValue(),
        conteudo: `Olá, ${nome}! O pagamento da sua OS #${termoLiberacao.getOrdemServicoId().toValue()} foi confirmado e o seu veículo está liberado para retirada no pátio físico.`,
        titulo: 'Termo de liberacao',
        template: 'termo-liberacao',
      })
    })
  })

  it('deve chamar caso de uso CriarNotificacao quando motivo for REJEICAO_ORCAMENTO', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const usuario = makeUsuario({}, cliente.getId())
    await usuarioRepository.create(usuario)

    const veiculo = makeVeiculo()
    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: new UniqueEntityID(),
      mecanicoId: new UniqueEntityID(),
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      descricao: 'descricao',
      eGarantia: false,
      prioridade,
    })
    await ordemServicoRepository.create(os)

    const termoLiberacao = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'REJEICAO_ORCAMENTO',
    })

    const evento = new TermoLiberacaoPorRejeicaoEmitidoEvent(termoLiberacao)
    DomainEvents.dispatch(evento)

    const nome = cliente.getNome().getValor()

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalledWith({
        destinatarioId: cliente.getId().toValue(),
        conteudo: `Olá, ${nome}! Conforme sua solicitação, a OS #${termoLiberacao.getOrdemServicoId().toValue()} foi encerrada e o seu veículo está liberado para retirada no pátio físico.`,
        titulo: 'Termo de liberacao',
        template: 'termo-liberacao',
      })
    })
  })

  it('deve capturar erro e logar no console quando os dados do cliente não forem encontrados', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => { })

    const cliente = makeCliente()
    const veiculo = makeVeiculo()
    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: new UniqueEntityID(),
      mecanicoId: new UniqueEntityID(),
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      descricao: 'descricao',
      eGarantia: false,
      prioridade,
    })

    // Note: A OS é criada mas não é salva no repositório, simulando cliente/OS não encontrados no gateway
    const termoLiberacao = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'REJEICAO_ORCAMENTO',
    })

    const evento = new TermoLiberacaoPorRejeicaoEmitidoEvent(termoLiberacao)
    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[Subscriber Warning]: Falha ao notificar cliente sobre a emissão do termo de liberação #${termoLiberacao.getId().toValue()}`,
        expect.any(Error),
      )
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })
})