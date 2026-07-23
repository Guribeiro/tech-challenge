import { CriarClienteUseCase } from '@/modules/os-orcamento/application/use-cases/clientes/criar-cliente.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'
import { makeCliente } from '../../factories/make-cliente.js'

let clienteRepository: InMemoryClienteRepository
let sut: CriarClienteUseCase

describe('Criar cliente', () => {
  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new CriarClienteUseCase(clienteRepository)
  })

  it('deve criar um cliente com sucesso', async () => {
    const cliente = makeCliente()
    const output = await sut.execute({
      nome: cliente.getNome().getValor(),
      email: cliente.getEmail().getValor(),
      telefone: cliente.getTelefone().getValor(),
      cpf: cliente.getCpf().getValor(),
      tipo: cliente.getTipo(),
    })

    expect(output.cliente.getNome().getValor()).toBe(cliente.getNome().getValor())
    expect(output.cliente.getEmail().getValor()).toBe(cliente.getEmail().getValor())
    expect(output.cliente.getTelefone().getValor()).toBe(cliente.getTelefone().getValor())
  })
})