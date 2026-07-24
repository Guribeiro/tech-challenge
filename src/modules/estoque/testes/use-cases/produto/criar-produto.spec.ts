import { CriarProdutoUseCase, CriarProdutoInput } from '@/modules/estoque/application/use-cases/criar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'

let produtoRepository: InMemoryProdutoRepository
let sut: CriarProdutoUseCase

describe('Caso de Uso: Criar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new CriarProdutoUseCase(produtoRepository)
  })

  it('deve criar um produto com sucesso', async () => {
    const produto = makeProduto()

    const output = await sut.execute({
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

    expect(output.produto.getNome()).toBe(produto.getNome())
  })

  it('deve criar um produto INSUMOS com sucesso', async () => {
    const produto = makeProduto()

    const output = await sut.execute({
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

    expect(output.produto).toHaveProperty('_id')
    expect(output.produto.getNome()).toBe(produto.getNome())
    expect(output.produto.getTipo()).toBe('INSUMO')
  })
  it('deve criar um produto PECA com sucesso', async () => {
    const produto = makeProduto()

    const output = await sut.execute({
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
    expect(output.produto).toHaveProperty('_id')
    expect(output.produto.getNome()).toBe(produto.getNome())
    expect(output.produto.getTipo()).toBe('PECA')
  })

  it('não deve criar um produto com estoque negativo', async () => {
    const produto = makeProduto()
    await expect(
      sut.execute({
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
    ).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar um produto com preço unitário negativo', async () => {
    const produto = makeProduto()
    await expect(
      sut.execute({
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
    ).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar produto com nome duplicado', async () => {
    const produto = makeProduto({ nome: 'Pastilha Freio' })

    await produtoRepository.create(produto)

    await expect(
      sut.execute({
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
    ).rejects.toBeInstanceOf(Error)
  })
})