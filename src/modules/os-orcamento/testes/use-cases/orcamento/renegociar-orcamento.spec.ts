import { beforeEach, describe, expect, it } from 'vitest'
import { RenegociarOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/renegociar-orcamento.js'
import { RenegociarOrcamentoService } from '@/modules/os-orcamento/domain/services/renegociar-orcamento.service.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { InMemoryUsuariosRepository } from '@/modules/autenticacao/testes/repositories/in-memory-users-repository.js'
import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { makeOrcamento } from '../../factories/make-orcamento.js'
import { makeUsuario } from '@/modules/autenticacao/testes/factories/make-usuario.js'
import { makeServico } from '../../factories/make-servico.js'
import { makeProduto } from '@/modules/estoque/testes/factories/make-produto.js'
import { AcessoNegadoError, RecursoNaoEncontradoError } from '@/core/errors/index.js'

describe('RenegociarOrcamentoUseCase', () => {
  let inMemoryOrcamentoRepository: InMemoryOrcamentoRepository
  let inMemoryUsuariosRepository: InMemoryUsuariosRepository
  let inMemoryServicosRepository: InMemoryServicoRepository
  let inMemoryProdutosRepository: InMemoryProdutoRepository
  let renegociarOrcamentoService: RenegociarOrcamentoService
  let sut: RenegociarOrcamentoUseCase

  beforeEach(() => {
    inMemoryOrcamentoRepository = new InMemoryOrcamentoRepository()
    inMemoryUsuariosRepository = new InMemoryUsuariosRepository()
    inMemoryServicosRepository = new InMemoryServicoRepository()
    inMemoryProdutosRepository = new InMemoryProdutoRepository()

    renegociarOrcamentoService = new RenegociarOrcamentoService(
      inMemoryServicosRepository,
      inMemoryProdutosRepository,
    )

    sut = new RenegociarOrcamentoUseCase(
      inMemoryOrcamentoRepository,
      inMemoryUsuariosRepository,
      renegociarOrcamentoService,
    )
  })

  it('deve renegociar um orçamento com sucesso quando o usuário tem permissão', async () => {
    const usuario = makeUsuario({ role: 'ADMIN' })
    await inMemoryUsuariosRepository.create(usuario)

    const servico = makeServico()
    await inMemoryServicosRepository.create(servico)

    const produto = makeProduto({ precoUnitario: 100, quantidadeEstoque: 10, precoCusto: 80 })
    await inMemoryProdutosRepository.create(produto)

    const orcamento = makeOrcamento({ status: 'RECUSADO' })
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      usuarioId: usuario.getId().toValue(),
      orcamentoId: orcamento.getId().toValue(),
      servicos: [{ servicoId: servico.getId().toValue() }],
      componentes: [{ produtoId: produto.getId().toValue(), quantidade: 2 }],
      descontoPorcentagem: 10,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orcamento.getId()).toEqual(orcamento.getId())
    }

    expect(inMemoryOrcamentoRepository.items[0]).toBeDefined()
  })

  it('não deve permitir renegociação se o usuário não for encontrado', async () => {
    const orcamento = makeOrcamento()
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      usuarioId: 'usuario-inexistente-id',
      orcamentoId: orcamento.getId().toValue(),
      descontoPorcentagem: 5,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })

  it('não deve permitir renegociação se a role do usuário não for permitida', async () => {
    const usuarioSemPermissao = makeUsuario({ role: 'CLIENTE' })
    await inMemoryUsuariosRepository.create(usuarioSemPermissao)

    const orcamento = makeOrcamento()
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      usuarioId: usuarioSemPermissao.getId().toValue(),
      orcamentoId: orcamento.getId().toValue(),
      descontoPorcentagem: 5,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })

  it('não deve renegociar se o orçamento não for encontrado', async () => {
    const usuario = makeUsuario({ role: 'MECANICO' })
    await inMemoryUsuariosRepository.create(usuario)

    const result = await sut.execute({
      usuarioId: usuario.getId().toValue(),
      orcamentoId: 'orcamento-inexistente-id',
      descontoPorcentagem: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
    expect(result.value).toEqual(new RecursoNaoEncontradoError('Orçamento'))
  })

  it('deve retornar erro se o serviço informado no input não for encontrado pelo Domain Service', async () => {
    const usuario = makeUsuario({ role: 'RECEPCAO' })
    await inMemoryUsuariosRepository.create(usuario)

    const orcamento = makeOrcamento()
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      usuarioId: usuario.getId().toValue(),
      orcamentoId: orcamento.getId().toValue(),
      servicos: [{ servicoId: 'servico-inexistente-id' }],
      descontoPorcentagem: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar erro se o produto informado no input não for encontrado pelo Domain Service', async () => {
    const usuario = makeUsuario({ role: 'ADMIN' })
    await inMemoryUsuariosRepository.create(usuario)

    const orcamento = makeOrcamento()
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      usuarioId: usuario.getId().toValue(),
      orcamentoId: orcamento.getId().toValue(),
      componentes: [{ produtoId: 'produto-inexistente-id', quantidade: 1 }],
      descontoPorcentagem: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })
})