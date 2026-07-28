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
    const resultado = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: cliente.getId().toValue()
    })

    // 3. Assert (Verifica estritamente o papel do Caso de Uso)
    expect(resultado.orcamento.getStatus()).toBe('APROVADO')

    // Valida se foi realmente persistido no repositório
    const orcamentoNoBanco = await orcamentoRepository.findById(orcamento.getId().toValue())
    expect(orcamentoNoBanco?.getStatus()).toBe('APROVADO')
  })

  it('deve lançar erro caso o orçamento não exista', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    await expect(sut.execute({
      orcamentoId: 'orcamento-inexistente',
      clienteId: cliente.getId().toValue()
    })).rejects.toThrow('Orçamento com ID orcamento-inexistente não encontrado.')
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

    await expect(sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: 'cliente-inexistente'
    })).rejects.toThrow('Cliente não encontrado')
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
    await expect(sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: clienteIntruso.getId().toValue()
    })).rejects.toThrow('Você não tem permissão para aprovar este orçamento')
  })
})