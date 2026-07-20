import { DeduzirEstoqueUseCase } from "@/modules/estoque/application/use-cases/deduzir-estoque.js";
import { InMemoryProdutoRepository } from "../../repositories/in-memory-produto-repository.js";
import { makeProduto } from "../../factories/make-produto.js";
import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js";
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { makeCliente } from "@/modules/os-orcamento/testes/factories/make-cliente.js";
import { InMemoryClienteRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js";
import { InMemoryVeiculoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-veiculo-repository.js";
import { InMemoryServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-servico-repository.js";
import { InMemoryMecanicosRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js";
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js";
import { makeServico } from "@/modules/os-orcamento/testes/factories/make-servico.js";
import { makeMecanico } from "@/modules/os-orcamento/testes/factories/make-mecanico.js";
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js";
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js";
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js";
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js";
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js";

describe('Caso de Uso: Deduzir Estoque', () => {
  let sut: DeduzirEstoqueUseCase
  let produtoRepository: InMemoryProdutoRepository
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let servicoRepository: InMemoryServicoRepository
  let mecanicoRepository: InMemoryMecanicosRepository

  const quantidadeEstoque = 50
  const quantidadeReservada = 3

  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()

    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    sut = new DeduzirEstoqueUseCase(produtoRepository)
  })

  it('deve deduzir quantidade do produto reservada em estoque', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    await servicoRepository.create(servico)

    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const produto = makeProduto({ quantidadeEstoque })

    produto.reservar(quantidadeReservada)

    await produtoRepository.create(produto)

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
    })

    const osComponente = new OrdemServicoComponente({
      produtoId: produto.getId(),
      precoUnitario: produto.getPrecoUnitario(),
      quantidade: quantidadeReservada,
      tipo: "INSUMO",
      descricao: 'alguma descricao'
    })


    const servicos = new OrdemServicoServicoList([osServicos])

    const componentes = new OrdemServicoComponenteList([osComponente])

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
      componentes,
    })

    ordemServicoRepository.create(ordemServico)

    await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      itens: ordemServico.getComponentes().getItems().map(componente => ({
        produtoId: componente.getProdutoId().toValue(),
        quantidade: componente.getQuantidade()
      }))
    })

    const produtoReservado = produtoRepository.produtos.find(p => p.getId().equals(produto.getId()))

    expect(produtoReservado?.getQuantidadeEstoque()).toBe(quantidadeEstoque - quantidadeReservada)
  })


  it('não deve deduzir quantidade do produto reservada em estoque quando o produto não existe', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    await servicoRepository.create(servico)

    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const produto = makeProduto({ quantidadeEstoque: 50 })

    produto.reservar(3)


    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
    })

    const osComponente = new OrdemServicoComponente({
      produtoId: produto.getId(),
      precoUnitario: produto.getPrecoUnitario(),
      quantidade: 3,
      tipo: "INSUMO",
      descricao: 'alguma descricao'
    })


    const servicos = new OrdemServicoServicoList([osServicos])

    const componentes = new OrdemServicoComponenteList([osComponente])

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
      componentes,
    })

    ordemServicoRepository.create(ordemServico)

    await expect(sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      itens: ordemServico.getComponentes().getItems().map(componente => ({
        produtoId: componente.getProdutoId().toValue(),
        quantidade: componente.getQuantidade()
      }))
    })).rejects.toBeInstanceOf(Error)
  })
})