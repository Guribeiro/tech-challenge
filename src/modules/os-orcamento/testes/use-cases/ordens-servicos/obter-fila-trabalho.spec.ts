import { ObterFilaTrabalhoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordens-servico-repository.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/modules/os-orcamento/domain/entities/value-objects/email.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeOrdemServicoServicoList } from '../../factories/make-ordem-servico-servico-list.js'

let ordemServicoRepository: InMemoryOrdemServicoRepository
let sut: ObterFilaTrabalhoUseCase

describe('Obter fila de trabalho', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    sut = new ObterFilaTrabalhoUseCase(ordemServicoRepository)
  })

  it('deve retornar a fila de trabalho ordenada por prioridade', async () => {

    const cliente = Cliente.criar({
      email: Email.criar('cliente@email.com'),
      nome: NomeCompleto.criar('Cliente Teste'),
      telefone: Telefone.criar('11999999999'),
      tipo: 'PF',
    })


    const veiculo = Veiculo.criar({
      marca: 'Marca Teste',
      placa: Placa.criar('ABC1234'),
      modelo: 'Modelo Teste',
      ano: 2020,
    })

    const cliente2 = Cliente.criar({
      email: Email.criar('cliente@email.com'),
      nome: NomeCompleto.criar('Cliente Teste'),
      telefone: Telefone.criar('11999999999'),
      tipo: 'PF',
    })


    const veiculo2 = Veiculo.criar({
      marca: 'Marca Teste',
      placa: Placa.criar('ABC1234'),
      modelo: 'Modelo Teste',
      ano: 2020,
    })


    const osServiceBaixaPrioridadeList = makeOrdemServicoServicoList()

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente.getId()),
      veiculoId: new UniqueEntityID(veiculo.getId()),
      descricao: 'Ordem de serviço 1',
      eGarantia: false,
      servicos: osServiceBaixaPrioridadeList,
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: osServiceBaixaPrioridadeList.getItems().map(servico => servico.getCategoria()),
      }),
    })

    const osServiceAltaPrioridadeList = makeOrdemServicoServicoList([{ categoria: 'MECANICA_GERAL' }, { categoria: 'SEGURANCA' }, { categoria: 'MANUTENCAO_PREVENTIVA' }])

    const ordemServicoAltaPrioridade = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente2.getId()),
      veiculoId: new UniqueEntityID(veiculo2.getId()),
      descricao: 'Ordem de serviço 2',
      eGarantia: false,
      servicos: osServiceAltaPrioridadeList,
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente2.getTipo() === 'PJ',
        anoVeiculo: veiculo2.getAno(),
        categoriasDosServicos: osServiceBaixaPrioridadeList.getItems().map(servico => servico.getCategoria()),
      }),
    })

    await ordemServicoRepository.create(ordemServicoBaixaPrioridade)
    await ordemServicoRepository.create(ordemServicoAltaPrioridade)

    const { fila } = await sut.executar()

    expect(fila).toHaveLength(2)
    expect(fila[0].getPrioridade().getTipo()).toBe(ordemServicoAltaPrioridade.getPrioridade().getTipo())
    expect(fila[1].getPrioridade().getTipo()).toBe(ordemServicoBaixaPrioridade.getPrioridade().getTipo())
  })
})