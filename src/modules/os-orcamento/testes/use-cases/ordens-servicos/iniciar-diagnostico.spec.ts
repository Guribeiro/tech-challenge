import { IniciarDiagnosticoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/iniciar-diagnostico.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js'
import { InMemoryMecanicosRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeMecanico } from '../../factories/make-mecanico.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { OnDiagnosticoInicializado } from '@/modules/notificacoes/application/subscribers/on-diagnostico-inicializado.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { InMemoryNotificacaoService } from '@/modules/notificacoes/testes/services/in-memory-notificacao-service.js'
import { InMemoryVeiculoRepository } from '../../repositories/in-memory-veiculo-repository.js'
import { makeServico } from '../../factories/make-servico.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/ordem-servico-servico.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'

let notificacaoService: InMemoryNotificacaoService
let ordemServicoRepository: InMemoryOrdemServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let sut: IniciarDiagnosticoUseCase


describe('Iniciar diagnostico', () => {
  beforeEach(() => {
    notificacaoService = new InMemoryNotificacaoService()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()

    sut = new IniciarDiagnosticoUseCase(
      ordemServicoRepository,
      mecanicoRepository,
      veiculoRepository
    )

    new OnDiagnosticoInicializado(clienteRepository, notificacaoService)
  })

  it('deve iniciar o diagnostico e disparar politica de notificacao', async () => {
    const mecanico = makeMecanico()
    mecanicoRepository.create(mecanico)

    const cliente = makeCliente()
    clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    veiculoRepository.create(veiculo)

    const spy = vi.spyOn(notificacaoService, 'enviar')

    const servico = makeServico({
      categoria: 'ELETRICA'
    })

    const ordemServicoId = new UniqueEntityID()

    const osServico = OrdemServicoServico.criar({
      ordemServicoId,
      servicoId: servico.getId(),
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      descricao: servico.getDescricao(),
      observacao: 'Reparos nos sistema eletrico',
    })

    const osServicoList = new OrdemServicoServicoList([osServico])

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço 1',
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

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)

    const { ordemServico } = await sut.execute({
      ordemServicoId: ordemServicoBaixaPrioridade.getId().toValue(),
      mecanicoId: mecanico.getId().toValue()
    })

    expect(ordemServico.getStatus()).toBe('EM_DIAGNOSTICO')

    expect(ordemServico.getMecanicoId()?.equals(mecanico.getId())).toBe(true)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatario: cliente.getTelefone().getValor(),
        mensagem: expect.stringContaining(ordemServicoBaixaPrioridade.getId().toValue())
      })
    )
  })

  it('não deve iniciar inspeção se o mecanico não existir', async () => {
    const mecanicoId = new UniqueEntityID()

    const cliente = makeCliente()

    clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    const spy = vi.spyOn(notificacaoService, 'enviar')

    const servico = makeServico({
      categoria: 'ELETRICA'
    })

    const ordemServicoId = new UniqueEntityID()

    const osServico = OrdemServicoServico.criar({
      ordemServicoId,
      servicoId: servico.getId(),
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      descricao: servico.getDescricao(),
      observacao: 'Reparos nos sistema eletrico'
    })

    const osServicoList = new OrdemServicoServicoList([osServico])

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço 1',
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

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)

    await expect(sut.execute({
      ordemServicoId: ordemServicoBaixaPrioridade.getId().toValue(),
      mecanicoId: mecanicoId.toValue()
    })).rejects.toBeInstanceOf(Error)

    expect(spy).not.toHaveBeenCalled()
  })

  it('não deve iniciar inspeção se o veiculo não existir', async () => {
    const mecanico = makeMecanico()

    mecanicoRepository.create(mecanico)

    const cliente = makeCliente()

    clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    const spy = vi.spyOn(notificacaoService, 'enviar')

    const servico = makeServico({
      categoria: 'ELETRICA'
    })

    const ordemServicoId = new UniqueEntityID()

    const osServico = OrdemServicoServico.criar({
      ordemServicoId,
      servicoId: servico.getId(),
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      descricao: servico.getDescricao(),
      observacao: 'Reparos nos sistema eletrico'
    })

    const osServicoList = new OrdemServicoServicoList([osServico])

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço 1',
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

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)

    await expect(sut.execute({
      ordemServicoId: ordemServicoBaixaPrioridade.getId().toValue(),
      mecanicoId: mecanico.getId().toValue()
    })).rejects.toBeInstanceOf(Error)

    expect(spy).not.toHaveBeenCalled()
  })
})