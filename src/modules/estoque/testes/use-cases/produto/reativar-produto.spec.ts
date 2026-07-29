import { ReativarProdutoUseCase } from '@/modules/estoque/application/use-cases/reativar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'

let produtoRepository: InMemoryProdutoRepository
let sut: ReativarProdutoUseCase

describe('Caso de Uso: Reativar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new ReativarProdutoUseCase(produtoRepository)
  })

  it('deve reativar um produto com sucesso', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      precoUnitario: 8000,
      quantidadeReservada: 0,
      precoCusto: 6000,
      desativadoEm: new Date()
    })

    await produtoRepository.create(produto)

    const result = await sut.execute({ produtoId: produto.getId().toValue() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.isAtivo()).toBe(true)
    }

  })

  it('não deve reativar um produto inexistente', async () => {
    const produto = makeProduto({ desativadoEm: new Date() })
    const result = await sut.execute({ produtoId: produto.getId().toValue() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
    }
  })

})