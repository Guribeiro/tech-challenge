import { describe, beforeEach, it, expect } from 'vitest'
import { EditarClienteUseCase } from '@/modules/os-orcamento/application/use-cases/clientes/editar-cliente.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { Email } from '@/shared/domain/value-objects/email.js'

describe('EditarClienteUseCase', () => {
  let clienteRepository: InMemoryClienteRepository
  let sut: EditarClienteUseCase

  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new EditarClienteUseCase(clienteRepository)
  })

  it('deve editar os dados de um cliente com sucesso', async () => {
    const cliente = makeCliente({
      nome: NomeCompleto.criar('Nome Antigo'),
      email: Email.criar('antigo@email.com'),
    })
    await clienteRepository.create(cliente)

    const result = await sut.execute({
      id: cliente.getId().toValue(),
      nome: 'Nome Atualizado',
      email: 'novo@email.com',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.getNome().getValor()).toBe('Nome Atualizado')
      expect(result.value.cliente.getEmail().getValor()).toBe('novo@email.com')

      const clienteNoBanco = clienteRepository.clientes[0]
      expect(clienteNoBanco.getNome().getValor()).toBe('Nome Atualizado')
      expect(clienteNoBanco.getEmail().getValor()).toBe('novo@email.com')
    }
  })

  it('deve permitir que o cliente atualize seus dados mantendo o seu próprio e-mail', async () => {
    const cliente = makeCliente({
      email: Email.criar('antigo@email.com'),
    })
    await clienteRepository.create(cliente)

    const result = await sut.execute({
      id: cliente.getId().toValue(),
      email: 'mesmo@email.com',
      nome: 'Novo Nome',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.getNome().getValor()).toBe('Novo Nome')
    }
  })

  it('deve retornar RecursoNaoEncontradoError se o cliente não existir', async () => {
    const result = await sut.execute({
      id: 'id-inexistente',
      nome: 'Novo Nome',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar EmailJaCadastradoError ao tentar usar e-mail de outro cliente', async () => {
    const cliente1 = makeCliente({
      email: Email.criar('cliente1@email.com')
    })
    const cliente2 = makeCliente({
      email: Email.criar('cliente2@email.com')
    })

    await clienteRepository.create(cliente1)
    await clienteRepository.create(cliente2)

    const result = await sut.execute({
      id: cliente1.getId().toValue(),
      email: 'cliente2@email.com',
    })

    // Assert
    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailJaCadastradoError)
  })
})