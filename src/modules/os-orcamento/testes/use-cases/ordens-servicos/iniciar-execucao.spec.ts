import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { IniciarExecucaoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/iniciar-execucao.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js"
import { CriarNotificacaoUseCase } from "@/modules/notificacoes/application/use-cases/criar-notificacao.js"
import { ClienteOrdemServicoGateway } from "@/modules/notificacoes/application/gateways/cliente-ordem-servico-gateway.js"
import { OnExecucaoIniciada } from "@/modules/notificacoes/application/subscribers/on-os-execucao-iniciada.js"
import { makeCliente } from "../../factories/make-cliente.js"
import { makeMecanico } from "../../factories/make-mecanico.js"
import { makeServico } from "../../factories/make-servico.js"
import { makeVeiculo } from "../../factories/make-veiculo.js"
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js"
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js"
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordem-servico-repository.js"
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js"
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js"

describe('Iniciar execução de OS', () => {
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let mecanicoRepository: InMemoryMecanicosRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let servicoRepository: InMemoryServicoRepository
  let clienteOrdemServicoGateway: ClienteOrdemServicoGateway
  let criarNotificacao: CriarNotificacaoUseCase
  let sut: IniciarExecucaoUseCase

  beforeEach(() => {
    vi.clearAllMocks()

    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()

    clienteOrdemServicoGateway = {
      obterDadosClientePorOrdemServicoId: vi.fn(),
    } as unknown as ClienteOrdemServicoGateway

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    // Registra o subscriber que reage ao evento de inicio de execução
    new OnExecucaoIniciada(clienteOrdemServicoGateway, criarNotificacao)

    sut = new IniciarExecucaoUseCase(
      ordemServicoRepository,
      mecanicoRepository,
    )
  })

  it('mecânico deve poder iniciar a execução de uma OS e disparar notificação via subscriber', async () => {
    const mecanico = makeMecanico()
    await mecanicoRepository.create(mecanico)

    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const servico = makeServico({
      categoria: 'ELETRICA'
    })
    await servicoRepository.create(servico)

    const ordemServicoId = new UniqueEntityID()

    const osServico = OrdemServicoServico.criar({
      servicoId: servico.getId(),
      ordemServicoId,
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      descricao: servico.getDescricao(),
      observacao: 'Reparos no sistema elétrico'
    })

    const osServicoList = new OrdemServicoServicoList([osServico])

    const ordemServico = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço 1',
      status: 'PRONTA_PARA_INICIAR',
      eGarantia: false,
      servicos: osServicoList,
      componentes: new OrdemServicoComponenteList(),
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: osServicoList.getItems().map(servico => servico.getCategoria()),
      }),
    }, ordemServicoId)

    await ordemServicoRepository.create(ordemServico)

    // Configura o retorno do gateway simulando a busca dos dados do cliente
    vi.mocked(
      clienteOrdemServicoGateway.obterDadosClientePorOrdemServicoId,
    ).mockResolvedValueOnce({
      clienteId: cliente.getId().toValue(),
      clienteNome: cliente.getNome().getValor(),
      clienteTelefone: cliente.getTelefone().getValor(),
      ordemServicoId: ordemServico.getId().toValue(),
    })

    const result = await sut.execute({
      mecanicoId: mecanico.getId().toValue(),
      ordemServicoId: ordemServico.getId().toValue()
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.ordemServico.getId().equals(ordemServico.getId())).toBe(true)
      expect(result.value.ordemServico.getStatus()).toBe('EM_EXECUCAO')

      // Valida se o subscriber capturou o evento e chamou a criação da notificação com o novo DTO
      await vi.waitFor(() => {
        expect(criarNotificacao.execute).toHaveBeenCalledWith({
          destinatarioId: cliente.getId().toValue(),
          conteudo: expect.stringContaining(ordemServico.getId().toValue()),
          template: 'os-execucao-iniciada',
          titulo: 'Execução de OS iniciada',
        })
      })
    }
  })
})