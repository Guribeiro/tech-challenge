import { CriarProdutoUseCase, CriarProdutoInput } from '@/modules/estoque/application/use-cases/criar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'

let produtoRepository: InMemoryProdutoRepository
let sut: CriarProdutoUseCase

describe('Criar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new CriarProdutoUseCase(produtoRepository)
  })

  it('deve criar um produto com sucesso', async () => {
    const input: CriarProdutoInput = {
      nome: 'Produto',
      precoUnitario: 1000,
      quantidadeEstoque: 10,
      tipo: 'INSUMO',
      descricao: 'algum produto para o estoque'
    }

    const { produto } = await sut.execute(input)

    expect(produto.getNome()).toBe(input.nome)
    expect(produto).toHaveProperty('_id')
  })

  it('deve criar um produto INSUMOS com sucesso', async () => {
    const input: CriarProdutoInput = {
      nome: 'Produto',
      precoUnitario: 1000,
      quantidadeEstoque: 10,
      tipo: 'INSUMO',
      descricao: 'algum produto para o estoque'
    }

    const { produto } = await sut.execute(input)

    expect(produto).toHaveProperty('_id')
    expect(produto.getNome()).toBe(input.nome)
    expect(produto.getTipo()).toBe('INSUMO')
  })
  it('deve criar um produto PECA com sucesso', async () => {
    const input: CriarProdutoInput = {
      nome: 'Produto',
      precoUnitario: 1000,
      quantidadeEstoque: 10,
      tipo: 'PECA',
      descricao: 'algum produto para o estoque'
    }

    const { produto } = await sut.execute(input)

    expect(produto).toHaveProperty('_id')
    expect(produto.getNome()).toBe(input.nome)
    expect(produto.getTipo()).toBe('PECA')
  })

  it('não deve criar um produto com estoque negativo', async () => {
    const input: CriarProdutoInput = {
      nome: 'Produto',
      precoUnitario: 1000,
      quantidadeEstoque: -1,
      tipo: 'PECA',
      descricao: 'algum produto para o estoque'
    }

    await expect(sut.execute(input)).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar um produto com preço unitário negativo', async () => {
    const input: CriarProdutoInput = {
      nome: 'Produto',
      precoUnitario: -1,
      quantidadeEstoque: 10,
      tipo: 'PECA',
      descricao: 'algum produto para o estoque'
    }

    await expect(sut.execute(input)).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar produto com nome duplicado', async () => {
    const produto1 = makeProduto({ nome: 'Pastilha Freio' })

    await produtoRepository.create(produto1)

    const input: CriarProdutoInput = {
      nome: 'Pastilha Freio',
      precoUnitario: 1000,
      quantidadeEstoque: 10,
      tipo: 'PECA',
      descricao: 'algum produto para o estoque'
    }

    await expect(sut.execute(input)).rejects.toBeInstanceOf(Error)
  })
})