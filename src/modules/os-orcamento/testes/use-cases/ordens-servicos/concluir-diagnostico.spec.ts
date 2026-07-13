import { ConcluirDiagnosticoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/concluir-diagnostico.js";
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordens-servico-repository.js";
import { InMemoryOrcamentoRepository } from "../../repositories/in-memory-orcamento-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js";
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js";
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js";
import { makeServico } from "../../factories/make-servico.js";
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js";
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js";
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js";
import { makeMecanico } from "../../factories/make-mecanico.js";
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js";


let ordemServicoRepository: InMemoryOrdemServicoRepository
let orcamentoRepository: InMemoryOrcamentoRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let servicoRepository: InMemoryServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository

let sut: ConcluirDiagnosticoUseCase

describe('Concluir diagnostico', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    orcamentoRepository = new InMemoryOrcamentoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()

    sut = new ConcluirDiagnosticoUseCase(
      ordemServicoRepository,
    )
  })

  it('deve concluir diagnostico do veiculo', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    await servicoRepository.create(servico)

    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: new UniqueEntityID(servico.getId()),
    })

    const servicos = new OrdemServicoServicoList([osServicos])

    const prioridade = Prioridade.calcular({
      eGarantia: true,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [osServicos.getCategoria()]
    });


    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(cliente.getId()),
      eGarantia: true,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: new UniqueEntityID(veiculo.getId()),
      prioridade,
      servicos,
      componentes: new OrdemServicoComponenteList(),
    })

    ordemServico.iniciarDiagnostico(new UniqueEntityID(mecanico.getId()))

    await ordemServicoRepository.create(ordemServico)

    await sut.execute({
      ordemServicoId: ordemServico.getId(),
    })

  })
})