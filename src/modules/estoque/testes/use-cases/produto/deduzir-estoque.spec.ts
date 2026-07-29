import { describe, beforeEach, it, expect } from 'vitest' // ou 'jest'
import { DeduzirEstoqueUseCase } from '@/modules/estoque/application/use-cases/deduzir-estoque.js'
import { InMemoryProdutoRepository } from '../../repositories/in-memory-produto-repository.js'
import { makeProduto } from '../../factories/make-produto.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

describe('DeduzirEstoqueUseCase', () => {
  let produtoRepository: InMemoryProdutoRepository
  let sut: DeduzirEstoqueUseCase // System Under Test

  beforeEach(() => {
    produtoRepository = new InMemoryProdutoRepository()
    sut = new DeduzirEstoqueUseCase(produtoRepository)
  })

  it('deve deduzir o estoque e a reserva dos produtos com sucesso', async () => {
    const produto1 = makeProduto({
      quantidadeEstoque: 10,
      quantidadeReservada: 5,
    })
    const produto2 = makeProduto({
      quantidadeEstoque: 20,
      quantidadeReservada: 10,
    })

    await produtoRepository.create(produto1)
    await produtoRepository.create(produto2)

    const result = await sut.execute({
      ordemServicoId: 'os-1',
      itens: [
        { produtoId: produto1.getId().toValue(), quantidade: 3 },
        { produtoId: produto2.getId().toValue(), quantidade: 5 },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeNull()

    const produto1Atualizado = produtoRepository.produtos[0]
    expect(produto1Atualizado.getQuantidadeEstoque()).toBe(7)  // 10 - 3
    expect(produto1Atualizado.getQuantidadeReservada()).toBe(2) // 5 - 3

    const produto2Atualizado = produtoRepository.produtos[1]
    expect(produto2Atualizado.getQuantidadeEstoque()).toBe(15) // 20 - 5
    expect(produto2Atualizado.getQuantidadeReservada()).toBe(5)  // 10 - 5
  })

  it('deve retornar RecursoNaoEncontradoError se um dos produtos não existir', async () => {
    // Arrange: Cria apenas 1 produto
    const produtoValido = makeProduto()
    await produtoRepository.create(produtoValido)

    // Act: Tenta deduzir um produto válido e um inexistente
    const result = await sut.execute({
      ordemServicoId: 'os-1',
      itens: [
        { produtoId: produtoValido.getId().toValue(), quantidade: 1 },
        { produtoId: 'id-inexistente', quantidade: 2 },
      ],
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve capturar um DomainError da entidade e retornar no left', async () => {
    const produto = makeProduto({
      quantidadeEstoque: 10,
      quantidadeReservada: 2,
    })
    await produtoRepository.create(produto)

    const result = await sut.execute({
      ordemServicoId: 'os-1',
      itens: [
        { produtoId: produto.getId().toValue(), quantidade: 5 },
      ],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ArgumentoInvalidoError)
  })
})