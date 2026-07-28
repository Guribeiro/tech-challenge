import { ConcluirDiagnosticoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/concluir-diagnostico.js";
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordem-servico-repository.js";
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
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js";
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js";
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js";
import { makeMecanico } from "../../factories/make-mecanico.js";
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js";
import { InMemoryProdutoRepository } from "@/modules/estoque/testes/repositories/in-memory-produto-repository.js";
import { InMemoryUsuariosRepository } from "@/modules/autenticacao/testes/repositories/in-memory-users-repository.js";
import { makeUsuario } from "@/modules/autenticacao/testes/factories/make-usuario.js";


let ordemServicoRepository: InMemoryOrdemServicoRepository
let orcamentoRepository: InMemoryOrcamentoRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let produtoRepository: InMemoryProdutoRepository
let servicoRepository: InMemoryServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository
let usuarioRepository: InMemoryUsuariosRepository

let sut: ConcluirDiagnosticoUseCase

describe('Concluir diagnostico', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    orcamentoRepository = new InMemoryOrcamentoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    produtoRepository = new InMemoryProdutoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    usuarioRepository = new InMemoryUsuariosRepository()

    sut = new ConcluirDiagnosticoUseCase(
      ordemServicoRepository,
      produtoRepository,
      servicoRepository,
      usuarioRepository
    )
  })

  it('deve concluir diagnostico do veiculo', async () => {

    const usuario = makeUsuario()

    usuarioRepository.create(usuario)

    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    await servicoRepository.create(servico)

    const mecanico = makeMecanico({
      email: usuario.getEmail()
    }, usuario.getId())

    await mecanicoRepository.create(mecanico)

    const ordemServicoId = new UniqueEntityID()

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
      ordemServicoId,
      criadoEm: new Date()
    })

    const servicos = new OrdemServicoServicoList([osServicos])

    const prioridade = Prioridade.calcular({
      eGarantia: true,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [osServicos.getCategoria()]
    });


    const ordemServico = OrdemServico.criar({
      clienteId: cliente.getId(),
      eGarantia: true,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId(),
      prioridade,
      servicos,
      componentes: new OrdemServicoComponenteList(),
    }, ordemServicoId)

    ordemServico.iniciarDiagnostico(mecanico.getId())

    await ordemServicoRepository.create(ordemServico)

    await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      usuarioId: mecanico.getId().toValue(),
      componentes: [],
      servicos: []
    })

  })
})