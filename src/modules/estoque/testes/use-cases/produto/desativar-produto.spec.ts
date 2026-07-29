import { DesativarProdutoUseCase } from '@/modules/estoque/application/use-cases/desativar-produto.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { RegraDeNegocioVioladaError } from '@/core/errors/domain-errors/regra-de-negocio-violada-error.js'

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

    const result = await sut.execute({ produtoId: produto.getId().toValue() })

    if (result.isRight()) {
      expect(result.value.produto.isAtivo()).toBe(false)
    }
  })

  it('não deve desativar um produto inexistente', async () => {
    // Act
    const result = await sut.execute({ produtoId: 'produto-inexistente' })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)

    if (result.isLeft()) {
      expect(result.value.message).toBe('Produto não encontrado(a).')
    }
  })
  it('não deve desativar um produto já desativado', async () => {
    const produto = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(produto)

    const result = await sut.execute({ produtoId: produto.getId().toValue() })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RegraDeNegocioVioladaError)

    if (result.isLeft()) {
      expect(result.value.message).toBe('Este produto já está desativado.')
    }
  })
})