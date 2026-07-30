import { describe, beforeEach, it, expect, vi } from 'vitest'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { AprovarOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/aprovar-orcamento.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { Orcamento } from '@/modules/os-orcamento/domain/entities/orcamento.js'
import { OrcamentoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/orcamento-componente-list.js'
import { OrcamentoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/orcamento-servico-list.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'

describe('Caso de Uso: Aprovar Orçamento', () => {
  let orcamentoRepository: InMemoryOrcamentoRepository
  let clienteRepository: InMemoryClienteRepository
  let sut: AprovarOrcamentoUseCase

  beforeEach(() => {
    DomainEvents.clearSubscribers()

    orcamentoRepository = new InMemoryOrcamentoRepository()
    clienteRepository = new InMemoryClienteRepository()

    sut = new AprovarOrcamentoUseCase(
      orcamentoRepository,
      clienteRepository
    )
  })

  it('deve aprovar um orçamento com sucesso', async () => {
    // 1. Arrange
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(),
      status: 'ENVIADO',
      clienteId: cliente.getId(),
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList()
    })
    await orcamentoRepository.save(orcamento)

    // 2. Act
    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: cliente.getId().toValue()
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.orcamento.getStatus()).toBe('APROVADO')
      const orcamentoNoBanco = await orcamentoRepository.findById(orcamento.getId().toValue())
      expect(orcamentoNoBanco?.getStatus()).toBe('APROVADO')
    }
  })

  it('deve lançar erro caso o orçamento não exista', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const result = await sut.execute({
      orcamentoId: 'orcamento-inexistente',
      clienteId: cliente.getId().toValue()
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve lançar erro caso o cliente não exista', async () => {
    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(),
      status: 'ENVIADO',
      clienteId: new UniqueEntityID(),
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList()
    })
    await orcamentoRepository.save(orcamento)

    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: 'cliente-inexistente'
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('não deve permitir que um cliente aprove o orçamento de outro cliente', async () => {
    const clienteDono = makeCliente()
    const clienteIntruso = makeCliente()

    await clienteRepository.create(clienteDono)
    await clienteRepository.create(clienteIntruso)

    const orcamento = Orcamento.criar({
      ordemServicoId: new UniqueEntityID(),
      status: 'ENVIADO',
      clienteId: clienteDono.getId(), // Pertence ao clienteDono
      componentes: new OrcamentoComponenteList(),
      servicos: new OrcamentoServicoList()
    })
    await orcamentoRepository.save(orcamento)

    // Tenta aprovar usando o ID do clienteIntruso
    const result = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: clienteIntruso.getId().toValue()
    })
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })
})