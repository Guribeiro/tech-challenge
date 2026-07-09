import { CriarCliente, CriarClientInput } from '@/modules/os-orcamento/application/use-cases/clientes/criar-cliente.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'

let clienteRepository: InMemoryClienteRepository
let sut: CriarCliente

describe('Criar cliente', () => {
  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new CriarCliente(clienteRepository)
  })

  it('deve criar um cliente com sucesso', async () => {
    const input: CriarClientInput = {
      id: '1',
      nome: 'João da Silva',
      tipo: 'PF',
      email: 'joao.silva@example.com',
      telefone: '11999999999'
    }

    const output = await sut.execute(input)

    expect(output.cliente.getNome().getValor()).toBe(input.nome)
    expect(output.cliente.getEmail().getValor()).toBe(input.email)
    expect(output.cliente.getTelefone().getValor()).toBe(input.telefone)
  })
})