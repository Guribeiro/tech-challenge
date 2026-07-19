import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { DomainEvents } from "@/core/events/domain-events.js"
import { EnviarNotificacaoUseCase } from "@/modules/notificacoes/domain/use-case/enviar-notificacao.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js"
import { OSEncerradaPorRejeicaoEvent } from "@/modules/os-orcamento/domain/events/os-encerrada-por-rejeicao-event.js"
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordens-servico-repository.js"
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js"
import { InMemoryClienteRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js"
import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js"
import { OnOrdemServicoEncerradaPorRejeicao } from "../../application/subscribers/on-os-encerrada-por-rejeicao.js"
import { EmitirTermoRejeicaoUseCase } from "../../application/use-cases/emitir-termo-liberacao-rejeicao.js"

describe('Subscriber: On OS Encerrada por Rejeicao', () => {
  let emitirTermoRejeicaoMock: EmitirTermoRejeicaoUseCase
  let ordemServicoRepository: OrdemServicoRepository
  let clienteRepository: ClienteRepository
  let enviarNotificacao: EnviarNotificacaoUseCase

  beforeEach(() => {
    emitirTermoRejeicaoMock = {
      execute: vi.fn()
    } as unknown as EmitirTermoRejeicaoUseCase

    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    enviarNotificacao = {
      execute: vi.fn()
    } as unknown as EnviarNotificacaoUseCase


    new OnOrdemServicoEncerradaPorRejeicao(
      emitirTermoRejeicaoMock,
    )
  })

  it('deve chamar o caso de uso Emitir Liberacao', async () => {
    const veiculo = makeVeiculo()

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: new UniqueEntityID(),
      veiculoId: new UniqueEntityID(),
      mecanicoId: new UniqueEntityID(),
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      descricao: 'descricao',
      eGarantia: false,
      prioridade,
    })

    const evento = new OSEncerradaPorRejeicaoEvent(os)

    DomainEvents.dispatch(evento)

    expect(emitirTermoRejeicaoMock.execute).toHaveBeenCalledWith({
      ordemServicoId: os.getId().toValue()
    })
  })

  it('deve capturar e logar o erro se o caso de uso falhar', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    emitirTermoRejeicaoMock.execute = vi.fn().mockRejectedValue(new Error('Erro interno do banco'))

    const veiculo = makeVeiculo()
    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: false,
      eGarantia: false,
    })
    const os = OrdemServico.criar({
      clienteId: new UniqueEntityID(),
      veiculoId: new UniqueEntityID(),
      mecanicoId: new UniqueEntityID(),
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      descricao: 'descricao',
      eGarantia: false,
      prioridade,
    })

    const evento = new OSEncerradaPorRejeicaoEvent(os)

    DomainEvents.dispatch(evento)

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Falha no processo automático pós-encerramento da OS #${os.getId()}`),
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })
})