import { describe, beforeEach, it, expect, vi } from 'vitest'
import { FaturaEmitidaEvent } from "@/modules/faturamento/domain/events/fatura-emitida-event.js";
import { OnFaturaEmitida } from "../../application/subscribers/on-fatura-emitida.js";
import { EnviarNotificacaoUseCase } from "../../domain/use-cases/enviar-notificacao.js";
import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js";
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
import { InMemoryClienteOrcamentoGateway } from "@/modules/faturamento/testes/gateways/in-memory-cliente-orcamento-gateway.js";
import { InMemoryOrcamentoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-orcamento-repository.js";
import { OrcamentoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/orcamento-componente-list.js";
import { OrcamentoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/orcamento-servico-list.js";

describe('Subscriber: On Fatura Emitida', () => {
  let orcamentoRepository: InMemoryOrcamentoRepository
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let enviarNotificacao: EnviarNotificacaoUseCase
  let clienteOrcamentoGateway: InMemoryClienteOrcamentoGateway

  beforeEach(() => {
    DomainEvents.clearSubscribers()

    orcamentoRepository = new InMemoryOrcamentoRepository()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()

    clienteOrcamentoGateway = new InMemoryClienteOrcamentoGateway(
      orcamentoRepository,
      ordemServicoRepository,
      clienteRepository
    )

    enviarNotificacao = {
      execute: vi.fn()
    } as unknown as EnviarNotificacaoUseCase

    new OnFaturaEmitida(
      clienteOrcamentoGateway,
      enviarNotificacao
    )
  })

  it('deve chamar caso de uso Enviar Notificacao', async () => {
    // Arrange
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
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList(),
    })
    // CORREÇÃO 1: Salvar o orçamento no repositório!
    await orcamentoRepository.create(orcamento)

    const fatura = Fatura.criar({
      orcamentoId: orcamento.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    // Act
    const evento = new FaturaEmitidaEvent(fatura)
    DomainEvents.dispatch(evento)

    // Assert
    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).toHaveBeenCalled()
    })
  })

  it('não deve chamar caso de uso Enviar Notificacao quando OS não existir', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => { })
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
    // NOTE: A OS NÃO É SALVA NO REPOSITÓRIO PROPÓSITAMENTE AQUI

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      ordemServicoId: os.getId(), // Associa a uma OS inexistente no repo
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList(),
    })
    // CORREÇÃO 1: Salvar o orçamento no repositório para o gateway avançar até a busca da OS
    await orcamentoRepository.create(orcamento)

    const fatura = Fatura.criar({
      orcamentoId: orcamento.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    const evento = new FaturaEmitidaEvent(fatura)
    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })
  })

  it('não deve chamar caso de uso Enviar Notificacao quando Cliente não existir', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => { })
    const cliente = makeCliente()
    // NOTE: O CLIENTE NÃO É SALVO NO REPOSITÓRIO PROPÓSITAMENTE AQUI

    const veiculo = makeVeiculo()
    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(), // Associa a um cliente inexistente
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
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList(),
    })
    // CORREÇÃO 1: Salvar o orçamento no repositório!
    await orcamentoRepository.create(orcamento)

    const fatura = Fatura.criar({
      orcamentoId: orcamento.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    const evento = new FaturaEmitidaEvent(fatura)
    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      expect(enviarNotificacao.execute).not.toHaveBeenCalled()
    })
  })
})