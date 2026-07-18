import { ReativarProdutoUseCase } from '@/modules/estoque/application/use-cases/reativar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'

let produtoRepository: InMemoryProdutoRepository
let sut: ReativarProdutoUseCase

describe('Reativar produto', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new ReativarProdutoUseCase(produtoRepository)
  })

  it('deve reativar um produto com sucesso', async () => {
    const produto = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(produto)

    const { produto: produtoAtivo } = await sut.execute({ produtoId: produto.getId().toValue() })

    expect(produtoAtivo.isAtivo()).toBe(true)
  })

  it('não deve reativar um produto inexistente', async () => {
    const produto = makeProduto({ desativadoEm: new Date() })
    await expect(
      sut.execute({ produtoId: produto.getId().toValue() })
    ).rejects.toBeInstanceOf(Error)
  })

})