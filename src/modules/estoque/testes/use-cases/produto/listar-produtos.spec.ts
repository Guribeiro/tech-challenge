import { ListarProdutosUseCase } from "@/modules/estoque/application/use-cases/listar-produtos.js"
import { InMemoryProdutoRepository } from "../../repositories/in-memory-produto-repository.js"
import { makeProduto } from "../../factories/make-produto.js"

describe('Caso de Uso: Listar Produtos', () => {
  let produtoRepository: InMemoryProdutoRepository
  let sut: ListarProdutosUseCase

  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new ListarProdutosUseCase(produtoRepository)
  })

  it('deve listar apenas produtos ativos por padrão com paginação padrão', async () => {
    // Cria 3 produtos ativos
    const produtosAtivos = Array.from({ length: 3 }).map(() => makeProduto())

    // Cria 1 produto deletado (soft delete)
    const produtoDeletado = makeProduto({ desativadoEm: new Date() })

    for (const produto of [...produtosAtivos, produtoDeletado]) {
      await produtoRepository.create(produto)
    }

    const output = await sut.execute({})

    expect(output.produtos).toHaveLength(3)
    expect(output.total).toBe(3)
    expect(output.pagina).toBe(1)
    expect(output.limite).toBe(10)
  })

  it('deve permitir paginar a listagem de produtos', async () => {
    // Cria 15 produtos em datas diferentes para garantir a ordem
    for (let i = 1; i <= 15; i++) {
      await produtoRepository.create(
        makeProduto({
          criadoEm: new Date(2026, 0, i),
        })
      )
    }

    // Busca a página 2 com limite de 5 itens por página
    const output = await sut.execute({
      pagina: 2,
      limite: 5,
    })

    expect(output.produtos).toHaveLength(5)
    expect(output.total).toBe(15)
    expect(output.pagina).toBe(2)
  })

  it('deve filtrar produtos deletados (soft delete)', async () => {
    const produtoAtivo = makeProduto()
    const produtoDeletado1 = makeProduto({ desativadoEm: new Date() })
    const produtoDeletado2 = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(produtoAtivo)
    await produtoRepository.create(produtoDeletado1)
    await produtoRepository.create(produtoDeletado2)

    const output = await sut.execute({
      status: 'deletados',
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)
    expect(output.produtos.map(produto => produto.getId())).toEqual([
      produtoDeletado1.getId(),
      produtoDeletado2.getId()
    ])
  })

  it('deve listar todos os produtos (ativos e deletados) quando status for "todos"', async () => {
    const produtoAtivo = makeProduto()
    const produtoDeletado = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(produtoAtivo)
    await produtoRepository.create(produtoDeletado)

    const output = await sut.execute({
      status: 'todos',
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)
  })

  it('deve buscar produtos por trecho do nome (case insensitive)', async () => {
    const produto1 = makeProduto({ nome: 'Fluido de Freio', tipo: 'INSUMO' })
    const produto2 = makeProduto({ nome: 'Ana Maria' })
    const produto3 = makeProduto({ nome: 'Outro Fluido de Freio', tipo: 'INSUMO' })

    await produtoRepository.create(produto1)
    await produtoRepository.create(produto2)
    await produtoRepository.create(produto3)

    const output = await sut.execute({
      nome: 'Fluido', // em minúsculas para testar case-insensitivity
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)

    expect(output.produtos.map(produto => produto.getNome())).toEqual([
      produto1.getNome(),
      produto3.getNome(),
    ])
  })
})