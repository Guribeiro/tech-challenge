import { IniciarDiagnosticoeCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/iniciar-diagnostico.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js'
import { InMemoryMecanicosRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeMecanico } from '../../factories/make-mecanico.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'

let ordemServicoRepository: InMemoryOrdemServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository
let sut: IniciarDiagnosticoeCase

describe('Iniciar inspeção', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    sut = new IniciarDiagnosticoeCase(ordemServicoRepository, mecanicoRepository)
  })

  it('deve iniciar a inspeção de uma ordem de serviço', async () => {
    const mecanico = makeMecanico()
    mecanicoRepository.create(mecanico)

    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente.getId()),
      veiculoId: new UniqueEntityID(veiculo.getId()),
      descricao: 'Ordem de serviço 1',
      eGarantia: false,
      servicos: [],
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: ['MECANICA'],
      }),
    })

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)

    const { ordemServico } = await sut.executar({
      ordemServicoId: ordemServicoBaixaPrioridade.getId(),
      mecanicoId: mecanico.getId()
    })

    expect(ordemServico.getStatus()).toBe('EM_DIAGNOSTICO')
    expect(ordemServico.getMecanicoId()?.toValue()).toBe(mecanico.getId())
  })

  it('não deve iniciar inspeção se o mecanico não existir', async () => {
    const mecanicoId = new UniqueEntityID()

    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente.getId()),
      veiculoId: new UniqueEntityID(veiculo.getId()),
      descricao: 'Ordem de serviço 1',
      eGarantia: false,
      servicos: [],
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: ['MECANICA'],
      }),
    })

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)

    await expect(sut.executar({
      ordemServicoId: ordemServicoBaixaPrioridade.getId(),
      mecanicoId: mecanicoId.toValue()
    })).rejects.toBeInstanceOf(Error)
  })
})