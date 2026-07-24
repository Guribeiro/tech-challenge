import { ObterFilaTrabalhoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordem-servico-repository.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeOrdemServicoServicoList } from '../../factories/make-ordem-servico-servico-list.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'

let ordemServicoRepository: InMemoryOrdemServicoRepository
let sut: ObterFilaTrabalhoUseCase

describe('Obter fila de trabalho', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    sut = new ObterFilaTrabalhoUseCase(ordemServicoRepository)
  })

  it('deve retornar a fila de trabalho ordenada por prioridade', async () => {

    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const cliente2 = makeCliente()

    const veiculo2 = makeVeiculo()

    const osServiceBaixaPrioridadeList = makeOrdemServicoServicoList()

    const ordemServicoBaixaPrioridade = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço 1',
      eGarantia: false,
      servicos: osServiceBaixaPrioridadeList,
      componentes: new OrdemServicoComponenteList([]),
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: osServiceBaixaPrioridadeList.getItems().map(servico => servico.getCategoria()),
      }),
    })

    const osServiceAltaPrioridadeList = makeOrdemServicoServicoList([{ categoria: 'MECANICA_GERAL' }, { categoria: 'SEGURANCA' }, { categoria: 'MANUTENCAO_PREVENTIVA' }])

    const ordemServicoAltaPrioridade = OrdemServico.criar({
      clienteId: cliente2.getId(),
      veiculoId: veiculo2.getId(),
      descricao: 'Ordem de serviço 2',
      eGarantia: false,
      servicos: osServiceAltaPrioridadeList,
      componentes: new OrdemServicoComponenteList([]),
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