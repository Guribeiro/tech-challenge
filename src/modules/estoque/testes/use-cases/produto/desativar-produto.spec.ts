import { DesativarProdutoUseCase } from '@/modules/estoque/application/use-cases/desativar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'

let produtoRepository: InMemoryProdutoRepository
let sut: DesativarProdutoUseCase

describe('Desativar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new DesativarProdutoUseCase(produtoRepository)
  })

  it('deve desativar um produto com sucesso', async () => {
    const produto = makeProduto()

    await produtoRepository.create(produto)

    const { produto: produtoDesativado } = await sut.execute({ produtoId: produto.getId() })

    expect(produtoDesativado.isAtivo()).toBe(false)
  })

  it('não deve desativar um produto inexistente', async () => {
    const produto = makeProduto()
    await expect(
      sut.execute({ produtoId: produto.getId() })
    ).rejects.toBeInstanceOf(Error)
  })

  it('não deve desativar um produto já desativado', async () => {
    const produto = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(produto)

    await expect(
      sut.execute({ produtoId: produto.getId() })
    ).rejects.toBeInstanceOf(Error)
  })
})