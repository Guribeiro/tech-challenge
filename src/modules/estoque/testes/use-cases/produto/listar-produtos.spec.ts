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

    // Cria 1 cliente deletado (soft delete)
    const clienteDeletado = makeProduto({ desativadoEm: new Date() })

    for (const cliente of [...produtosAtivos, clienteDeletado]) {
      await produtoRepository.create(cliente)
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
    const clienteAtivo = makeProduto()
    const clienteDeletado1 = makeProduto({ desativadoEm: new Date() })
    const clienteDeletado2 = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(clienteAtivo)
    await produtoRepository.create(clienteDeletado1)
    await produtoRepository.create(clienteDeletado2)

    const output = await sut.execute({
      status: 'deletados',
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)
    expect(output.produtos.map(cliente => cliente.getId())).toEqual([
      clienteDeletado1.getId(),
      clienteDeletado2.getId()
    ])
  })

  it('deve listar todos os produtos (ativos e deletados) quando status for "todos"', async () => {
    const clienteAtivo = makeProduto()
    const clienteDeletado = makeProduto({ desativadoEm: new Date() })

    await produtoRepository.create(clienteAtivo)
    await produtoRepository.create(clienteDeletado)

    const output = await sut.execute({
      status: 'todos',
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)
  })

  it('deve buscar produtos por trecho do nome (case insensitive)', async () => {
    const cliente1 = makeProduto({ nome: 'Carlos Eduardo' })
    const cliente2 = makeProduto({ nome: 'Ana Maria' })
    const cliente3 = makeProduto({ nome: 'Eduardo Silva' })

    await produtoRepository.create(cliente1)
    await produtoRepository.create(cliente2)
    await produtoRepository.create(cliente3)

    const output = await sut.execute({
      nome: 'eduardo', // em minúsculas para testar case-insensitivity
    })

    expect(output.produtos).toHaveLength(2)
    expect(output.total).toBe(2)

    expect(output.produtos.map(cliente => cliente.getNome())).toEqual([
      cliente1.getNome(),
      cliente3.getNome(),
    ])
  })
})