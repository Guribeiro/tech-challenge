import { beforeEach, describe, expect, it } from 'vitest'
import { RecusarOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/recusar-orcamento.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { makeOrcamento } from '../../factories/make-orcamento.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { AcessoNegadoError, RecursoNaoEncontradoError } from '@/core/errors/index.js'

describe('RecusarOrcamentoUseCase', () => {
  let inMemoryOrcamentoRepository: InMemoryOrcamentoRepository
  let inMemoryClienteRepository: InMemoryClienteRepository
  let sut: RecusarOrcamentoUseCase

  beforeEach(() => {
    inMemoryOrcamentoRepository = new InMemoryOrcamentoRepository()
    inMemoryClienteRepository = new InMemoryClienteRepository()
    sut = new RecusarOrcamentoUseCase(
      inMemoryOrcamentoRepository,
      inMemoryClienteRepository,
    )
  })

  it('deve ser possível recusar um orçamento com sucesso', async () => {
    const cliente = makeCliente()
    await inMemoryClienteRepository.create(cliente)

    const orcamento = makeOrcamento({
      clienteId: cliente.getId(),
      status: 'ENVIADO'
    })
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: cliente.getId().toValue(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orcamento.getStatus()).toBe('RECUSADO')
    }

    expect(inMemoryOrcamentoRepository.items[0].getStatus()).toBe('RECUSADO')
  })

  it('não deve ser possível recusar um orçamento inexistente', async () => {
    const cliente = makeCliente()
    await inMemoryClienteRepository.create(cliente)

    const result = await sut.execute({
      orcamentoId: 'orcamento-inexistente-id',
      clienteId: cliente.getId().toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
    expect(result.value).toEqual(new RecursoNaoEncontradoError('Orçamento'))
  })

  it('não deve ser possível recusar um orçamento se o cliente não existir', async () => {
    const orcamento = makeOrcamento()
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: 'cliente-inexistente-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
    expect(result.value).toEqual(new RecursoNaoEncontradoError('Cliente'))
  })

  it('não deve permitir que um cliente recuse o orçamento pertencente a outro cliente', async () => {
    const clienteDono = makeCliente()
    const outroCliente = makeCliente()

    await inMemoryClienteRepository.create(clienteDono)
    await inMemoryClienteRepository.create(outroCliente)

    const orcamento = makeOrcamento({
      clienteId: clienteDono.getId(),
    })
    await inMemoryOrcamentoRepository.create(orcamento)

    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: outroCliente.getId().toValue(), // Cliente incorreto tentando recusar
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })
})