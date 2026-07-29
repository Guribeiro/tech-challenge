import { CriarProdutoUseCase, CriarProdutoInput } from '@/modules/estoque/application/use-cases/criar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'
import { RegraDeNegocioVioladaError } from '@/core/errors/domain-errors/regra-de-negocio-violada-error.js'
import { DomainError } from '@/core/errors/domain-errors/domain-error.js'
import { ProdutoJaCadastradoError } from '@/core/errors/produto-ja-cadastrado-error.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

let produtoRepository: InMemoryProdutoRepository
let sut: CriarProdutoUseCase

describe('Caso de Uso: Criar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new CriarProdutoUseCase(produtoRepository)
  })

  it('deve criar um produto com sucesso', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000
    })

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: produto.getPrecoUnitario(),
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.produto.getNome()).toBe(produto.getNome())
    }

  })

  it('deve criar um produto INSUMOS com sucesso', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000,
    })

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: 'INSUMO',
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: produto.getPrecoUnitario(),
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.produto).toHaveProperty('_id')
      expect(result.value.produto.getNome()).toBe(produto.getNome())
      expect(result.value.produto.getTipo()).toBe('INSUMO')
    }
  })
  it('deve criar um produto PECA com sucesso', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000,
    })

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: 'PECA',
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: produto.getPrecoUnitario(),
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto).toHaveProperty('_id')
      expect(result.value.produto.getNome()).toBe(produto.getNome())
      expect(result.value.produto.getTipo()).toBe('INSUMO')
    }
  })

  it('não deve criar um produto com estoque negativo', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000,
    })

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: produto.getPrecoUnitario(),
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: -1,
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ArgumentoInvalidoError)
    }
  })

  it('não deve criar um produto com preço unitário negativo', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000,
    })

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: -1,
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DomainError)
    }
  })

  it('não deve criar produto com nome duplicado', async () => {
    const produto = makeProduto({ nome: 'Pastilha Freio' })

    await produtoRepository.create(produto)

    const result = await sut.execute({
      nome: produto.getNome(),
      tipo: produto.getTipo(),
      marca: produto.getMarca(),
      codigoSKU: produto.getCodigoSKU(),
      codigoFabricante: produto.getCodigoFabricante(),
      descricao: produto.getDescricao(),
      precoCusto: produto.getPrecoCusto(),
      precoUnitario: -1,
      estoqueMinimo: produto.getEstoqueMinimo(),
      quantidadeEstoque: produto.getQuantidadeEstoque(),
      estoqueMaximo: produto.getEstoqueMaximo(),
      localizacao: produto.getLocalizacao(),
      unidadeMedida: produto.getUnidadeMedida()
    })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ProdutoJaCadastradoError)
    }
  })
})