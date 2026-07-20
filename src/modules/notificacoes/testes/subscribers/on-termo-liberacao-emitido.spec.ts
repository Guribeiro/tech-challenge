import { DomainEvents } from '@/core/events/domain-events.js'
import { TermoLiberacaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-emitido-event.js'
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from '@/modules/liberacao/domain/events/termo-liberacao-por-rejeicao-emitido-event.js' // ◄ Importa o segundo evento
import { EnviarNotificacaoUseCase } from '@/modules/notificacoes/domain/use-cases/enviar-notificacao.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { OrdemServicoRepository } from '@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js'
import { OnTermoLiberacaoEmitido } from '../../application/subscribers/on-termo-liberacao-emitido.js'
import { TermoLiberacao } from '@/modules/liberacao/domain/entities/termo-liberacao.js'
import { makeCliente } from '@/modules/os-orcamento/testes/factories/make-cliente.js'
import { makeVeiculo } from '@/modules/os-orcamento/testes/factories/make-veiculo.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'

describe('Subscriber: On Fatura Emitida', () => {
  let ordemServicoRepository: OrdemServicoRepository
  let clienteRepository: ClienteRepository
  let enviarNotificacao: EnviarNotificacaoUseCase


  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    enviarNotificacao = {
      execute: vi.fn()
    } as unknown as EnviarNotificacaoUseCase

    new OnTermoLiberacaoEmitido(
      ordemServicoRepository,
      clienteRepository,
      enviarNotificacao
    )
  })

  it('deve chamar caso de uso Enviar Notificacao (PAGAMENTO_APROVADO)', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

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
      motivo: 'PAGAMENTO_APROVADO'
    })

    const evento = new TermoLiberacaoEmitidoEvent(termoLiberacao)

    DomainEvents.dispatch(evento)

    const telefone = cliente.getTelefone().getValor()
    const nome = cliente.getNome().getValor()

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalledWith({
        destinatario: telefone,
        mensagem: `Olá, ${nome}! O pagamento da sua OS #${termoLiberacao.getOrdemServicoId().toValue()} foi confirmado e o seu veículo está liberado para retirada no pátio físico.`
      })
    })
  })

  it('deve chamar caso de uso Enviar Notificacao (REJEICAO_ORCAMENTO)', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

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
      motivo: 'REJEICAO_ORCAMENTO'
    })

    const evento = new TermoLiberacaoEmitidoEvent(termoLiberacao)

    DomainEvents.dispatch(evento)

    const telefone = cliente.getTelefone().getValor()
    const nome = cliente.getNome().getValor()

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalledWith({
        destinatario: telefone,
        mensagem: `Olá, ${nome}! Conforme sua solicitação, a OS #${termoLiberacao.getOrdemServicoId().toValue()} foi encerrada e o seu veículo está liberado para retirada no pátio físico.`
      })
    })
  })

  it('não deve chamar caso de uso Enviar Notificacao quando Cliente não existe', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
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

    await ordemServicoRepository.create(os)

    const termoLiberacao = TermoLiberacao.criar({
      ordemServicoId: os.getId(),
      placaVeiculo: veiculo.getPlaca().getFormatada(),
      motivo: 'REJEICAO_ORCAMENTO'
    })

    const evento = new TermoLiberacaoEmitidoEvent(termoLiberacao)

    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      // Verifica se o warn exato foi emitido
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${termoLiberacao.getId().toValue()}`),
        expect.any(Error)
      )
      // Garante que o caso de uso realmente NÃO foi chamado
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })
  })
})