import { CriarOrdemServicoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordem-servico-repository.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { InMemoryVeiculoRepository } from '../../repositories/in-memory-veiculo-repository.js'
import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'

import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { makeServico } from '../../factories/make-servico.js'
import { makeProduto } from '@/modules/estoque/testes/factories/make-produto.js'
import { EstoqueInsuficienteError, RecursoNaoEncontradoError } from '@/core/errors/index.js'

let ordemServicoRepository: InMemoryOrdemServicoRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let servicoRepository: InMemoryServicoRepository
let produtoRepository: InMemoryProdutoRepository

let sut: CriarOrdemServicoUseCase

describe('Criar Ordem de Serviço Use Case', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    produtoRepository = new InMemoryProdutoRepository()

    sut = new CriarOrdemServicoUseCase(
      clienteRepository,
      veiculoRepository,
      produtoRepository,
      servicoRepository,
      ordemServicoRepository,
    )
  })

  it('deve criar uma ordem de serviço com sucesso (sem serviços e sem componentes)', async () => {
    // Arrange
    const cliente = makeCliente()
    const veiculo = makeVeiculo({ clienteId: cliente.getId() })

    await clienteRepository.create(cliente)
    await veiculoRepository.create(veiculo)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Barulho estranho na suspensão',
      eGarantia: false,
    })

    // Assert
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { ordemServico } = result.value
      expect(ordemServicoRepository.items[0]).toEqual(ordemServico)
      expect(ordemServico.getClienteId()).toEqual(cliente.getId())
      expect(ordemServico.getVeiculoId()).toEqual(veiculo.getId())
      expect(ordemServico.getDescricao()).toBe('Barulho estranho na suspensão')
      expect(ordemServico.getStatus()).toBe('RECEBIDA')
      expect(ordemServico.getServicos().getItems()).toHaveLength(0)
      expect(ordemServico.getComponentes().getItems()).toHaveLength(0)
    }
  })

  it('deve criar uma ordem de serviço incluindo serviços e componentes com estoque suficiente', async () => {
    // Arrange
    const cliente = makeCliente({ tipo: 'PJ' })
    const veiculo = makeVeiculo({ ano: 2022, clienteId: cliente.getId() })

    await clienteRepository.create(cliente)
    await veiculoRepository.create(veiculo)

    const servico = makeServico({ categoria: 'ESTETICA', valorReferencia: 150 })
    await servicoRepository.create(servico)

    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000
    })
    await produtoRepository.create(produto)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Troca de pastilhas de freio',
      eGarantia: false,
      servicos: [
        { servicoId: servico.getId().toValue() },
      ],
      componentes: [
        { produtoId: produto.getId().toValue(), quantidade: 2 },
      ],
    })

    // Assert
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { ordemServico } = result.value
      expect(ordemServico.getServicos().getItems()).toHaveLength(1)
      expect(ordemServico.getServicos().getItems()[0].getServicoId()).toEqual(servico.getId())
      expect(ordemServico.getComponentes().getItems()).toHaveLength(1)
      expect(ordemServico.getComponentes().getItems()[0].getQuantidade()).toBe(2)
      expect(ordemServico.getPrioridade()).toBeDefined()
    }
  })

  it('deve retornar RecursoNaoEncontradoError se o cliente não for encontrado', async () => {
    // Arrange
    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    // Act
    const result = await sut.execute({
      clienteId: 'cliente-inexistente',
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Revisão periódica',
      eGarantia: false,
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar RecursoNaoEncontradoError se o veículo não for encontrado', async () => {
    // Arrange
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: 'veiculo-inexistente',
      descricao: 'Revisão periódica',
      eGarantia: false,
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar RecursoNaoEncontradoError se algum serviço informado não existir', async () => {
    // Arrange
    const cliente = makeCliente()
    const veiculo = makeVeiculo({ clienteId: cliente.getId() })

    await clienteRepository.create(cliente)
    await veiculoRepository.create(veiculo)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Serviço inexistente no catálogo',
      eGarantia: false,
      servicos: [
        { servicoId: 'servico-inexistente' },
      ],
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar RecursoNaoEncontradoError se algum componente informado não existir', async () => {
    // Arrange
    const cliente = makeCliente()
    const veiculo = makeVeiculo({ clienteId: cliente.getId() })

    await clienteRepository.create(cliente)
    await veiculoRepository.create(veiculo)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Peça inexistente no catálogo',
      eGarantia: false,
      componentes: [
        { produtoId: 'produto-inexistente', quantidade: 1 },
      ],
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar EstoqueInsuficienteError se a quantidade do componente for maior do que o estoque disponível', async () => {
    // Arrange
    const cliente = makeCliente()
    const veiculo = makeVeiculo({ clienteId: cliente.getId() })

    await clienteRepository.create(cliente)
    await veiculoRepository.create(veiculo)

    const produtoComEstoqueBaixo = makeProduto({
      nome: 'Óleo Sintético 5W30',
      quantidadeReservada: 0,
      quantidadeEstoque: 2,
    })
    await produtoRepository.create(produtoComEstoqueBaixo)

    // Act
    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      veiculoId: veiculo.getId().toValue(),
      descricao: 'Troca de óleo',
      eGarantia: false,
      componentes: [
        { produtoId: produtoComEstoqueBaixo.getId().toValue(), quantidade: 5 }, // Pede 5, tem 2
      ],
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })
})