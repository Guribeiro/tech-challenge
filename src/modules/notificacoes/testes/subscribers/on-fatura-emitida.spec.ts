import { FaturaEmitidaEvent } from "@/modules/faturamento/domain/events/fatura-emitida-event.js";
import { OnFaturaEmitida } from "../../application/subscribers/on-fatura-emitida.js";
import { EnviarNotificacaoUseCase } from "../../domain/use-cases/enviar-notificacao.js";
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js";
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js";
import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js";
import { InMemoryClienteRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js";
import { Fatura } from "@/modules/faturamento/domain/entities/fatura.js";
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js";
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js";
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js";
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js";
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js";
import { makeCliente } from "@/modules/os-orcamento/testes/factories/make-cliente.js";
import { DomainEvents } from "@/core/events/domain-events.js";


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

    new OnFaturaEmitida(
      ordemServicoRepository,
      clienteRepository,
      enviarNotificacao
    )
  })

  it('deve chamar caso de uso Enviar Notificacao', async () => {
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

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      ordemServicoId: os.getId(),
      componentes: os.getComponentes().getItems(),
      servicos: os.getServicos().getItems(),
    })

    const fatura = Fatura.criar({
      ordemServicoId: os.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    const evento = new FaturaEmitidaEvent(fatura)

    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalled()
    })
  })

  it('não deve chamar caso de uso Enviar Notificacao quando OS não existir', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
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

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      ordemServicoId: os.getId(),
      componentes: os.getComponentes().getItems(),
      servicos: os.getServicos().getItems(),
    })

    const fatura = Fatura.criar({
      ordemServicoId: os.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    const evento = new FaturaEmitidaEvent(fatura)

    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      // Verifica se o warn exato foi emitido
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${fatura.getId()}`),
        expect.any(Error)
      )
      // Garante que o caso de uso realmente NÃO foi chamado
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })
  })

  it('não deve chamar caso de uso Enviar Notificacao quando Cliente não existir', async () => {
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

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      ordemServicoId: os.getId(),
      componentes: os.getComponentes().getItems(),
      servicos: os.getServicos().getItems(),
    })

    const fatura = Fatura.criar({
      ordemServicoId: os.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    const evento = new FaturaEmitidaEvent(fatura)

    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      // Verifica se o warn exato foi emitido
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[Subscriber Warning]: Falha no processo automático pós-faturamento da OS #${fatura.getId()}`),
        expect.any(Error)
      )
      // Garante que o caso de uso realmente NÃO foi chamado
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })
  })
})