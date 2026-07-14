import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { EnviarNotificacaoUseCase } from "@/modules/notificacoes/domain/use-case/enviar-notificacao.js"
import { InMemoryNotificacaoService } from "@/modules/notificacoes/testes/services/in-memory-notificacao-service.js"
import { IniciarExecucaoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/iniciar-execucao.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js"
import { makeCliente } from "../../factories/make-cliente.js"
import { makeMecanico } from "../../factories/make-mecanico.js"
import { makeServico } from "../../factories/make-servico.js"
import { makeVeiculo } from "../../factories/make-veiculo.js"
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js"
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js"
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordens-servico-repository.js"
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js"
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js"


describe('Iniciar execucao de OS', () => {
  let notificacaoService: InMemoryNotificacaoService
  let enviarNotificacaoUseCase: EnviarNotificacaoUseCase
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let mecanicoRepository: InMemoryMecanicosRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let servicoRepository: InMemoryServicoRepository
  let sut: IniciarExecucaoUseCase

  beforeEach(() => {
    notificacaoService = new InMemoryNotificacaoService()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()

    enviarNotificacaoUseCase = new EnviarNotificacaoUseCase(notificacaoService)

    sut = new IniciarExecucaoUseCase(
      ordemServicoRepository,
      mecanicoRepository,
    )

    vi.clearAllMocks()
  })

  it('mecanico deve poder iniciar a execucao de uma OS', async () => {
    const mecanico = makeMecanico()
    await mecanicoRepository.create(mecanico)

    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const spy = vi.spyOn(enviarNotificacaoUseCase, 'execute')

    const servico = makeServico({
      categoria: 'ELETRICA'
    })

    await servicoRepository.create(servico)

    const osServico = new OrdemServicoServico({
      servicoId: new UniqueEntityID(servico.getId()),
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      descricao: servico.getDescricao(),
      observacao: 'Reparos nos sistema eletrico'
    })

    const osServicoList = new OrdemServicoServicoList([osServico])

    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente.getId()),
      veiculoId: new UniqueEntityID(veiculo.getId()),
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
    })

    await ordemServicoRepository.create(ordemServico)

    const output = await sut.executar({
      mecanicoId: mecanico.getId(),
      ordemServicoId: ordemServico.getId()
    })

    expect(output.ordemServico.getId()).toBe(ordemServico.getId())
    expect(output.ordemServico.getStatus()).toBe('EM_EXECUCAO')

    vi.waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          destinatario: cliente.getTelefone().getValor(),
          mensagem: expect.stringContaining(ordemServico.getId())
        })
      )
    })

  })

})