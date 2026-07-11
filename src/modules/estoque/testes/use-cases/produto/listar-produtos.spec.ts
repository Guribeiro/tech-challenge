import { ListarProdutosUseCase } from '@/modules/estoque/application/use-cases/listar-produtos.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'

let produtoRepository: InMemoryProdutoRepository
let sut: ListarProdutosUseCase

describe('Listar produtos', () => {
  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new ListarProdutosUseCase(produtoRepository)
  })

  it('deve listar os produto com sucesso', async () => {
    const produtosParaCriar = [
      makeProduto({ nome: 'Pastilha de Freio A' }), // Ativo (desativadoEm: null)
      makeProduto({ nome: 'Filtro de Óleo B' }),   // Ativo (desativadoEm: null)
      makeProduto({ nome: 'Filtro de Óleo C', desativadoEm: new Date() })    // Desativado
    ]

    for (const produto of produtosParaCriar) {
      await produtoRepository.create(produto)
    }

    const { produtos } = await sut.execute()

    expect(produtos).toHaveLength(3)
    expect(produtos.map(produto => produto.toJSON())).toEqual([
      expect.objectContaining({ nome: 'Pastilha de Freio A' }),
      expect.objectContaining({ nome: 'Filtro de Óleo B' }),
      expect.objectContaining({ nome: 'Filtro de Óleo C' })
    ])
  })



})