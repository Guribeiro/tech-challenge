import { describe, beforeEach, it, expect } from 'vitest'
import { CriarClienteUseCase } from '@/modules/os-orcamento/application/use-cases/clientes/criar-cliente.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { CpfCnpj } from '@/modules/os-orcamento/domain/entities/value-objects/cpf-cnpj.js'

describe('CriarClienteUseCase', () => {
  let clienteRepository: InMemoryClienteRepository
  let sut: CriarClienteUseCase

  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new CriarClienteUseCase(clienteRepository)
  })

  it('deve criar um novo cliente com sucesso', async () => {
    const documento = makeCliente().getDocumento().getValor()
    const input = {
      nome: 'João da Silva',
      email: 'joao@email.com',
      documento: documento,
      telefone: '11999999999',
      tipo: 'PF' as const,
    }

    const result = await sut.execute(input)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente).toBeDefined()
      expect(result.value.cliente.getNome().getValor()).toBe('João da Silva')
      expect(result.value.cliente.getEmail().getValor()).toBe('joao@email.com')
      expect(clienteRepository.clientes).toHaveLength(1)
      expect(clienteRepository.clientes[0].getId().toValue()).toEqual(result.value.cliente.getId().toValue())
    }
  })

  it('deve retornar EmailJaCadastradoError ao tentar cadastrar e-mail duplicado', async () => {
    const emailExistente = 'cliente.existente@email.com'

    // Cadastra um cliente prévio no banco em memória com o e-mail que causará conflito
    const clienteExistente = makeCliente({
      email: Email.criar(emailExistente),
    })
    await clienteRepository.create(clienteExistente)

    const result = await sut.execute({
      nome: 'Outro Cliente',
      email: emailExistente,
      documento: '98765432100',
      telefone: '11988888888',
      tipo: 'PF',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailJaCadastradoError)
    expect(clienteRepository.clientes).toHaveLength(1)
  })

  it('deve retornar CpfJaCadastradoError ao tentar cadastrar CPF duplicado', async () => {
    const documentoExistente = makeCliente().getDocumento().getValor()

    // Cadastra um cliente prévio com o documento que causará conflito
    const clienteExistente = makeCliente({
      documento: CpfCnpj.criar(documentoExistente),
    })
    await clienteRepository.create(clienteExistente)

    const result = await sut.execute({
      nome: 'Outro Cliente',
      email: 'novo.email@email.com',
      documento: documentoExistente,
      telefone: '11988888888',
      tipo: 'PF',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CpfJaCadastradoError)
    expect(clienteRepository.clientes).toHaveLength(1)
  })
})