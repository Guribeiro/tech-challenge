import { EditarClienteUseCase } from "@/modules/os-orcamento/application/use-cases/clientes/editar-cliente.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";

describe('Caso de Uso: Editar Cliente', () => {
  let sut: EditarClienteUseCase
  let clienteRepository: InMemoryClienteRepository

  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new EditarClienteUseCase(clienteRepository)
  })

  it('deve atualizar um cliente', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const output = await sut.execute({
      email: 'novo@email.com',
      id: cliente.getId().toValue(),
      nome: 'Fulano da Silva',
      telefone: '11999999999',
      tipo: 'PF'
    })

    expect(output.cliente.getNome().getValor()).toBe('Fulano da Silva')
    expect(output.cliente.getEmail().getValor()).toBe('novo@email.com')
    expect(output.cliente.getTelefone().getValor()).toBe('11999999999')
    expect(output.cliente.getTipo()).toBe('PF')
  })

  it('não deve atualizar um cliente inexistente', async () => {
    const cliente = makeCliente()

    await expect(sut.execute({
      email: 'novo@email.com',
      id: cliente.getId().toValue(),
      nome: 'Fulano da Silva',
      telefone: '11999999999',
      tipo: 'PF'
    })).rejects.toBeInstanceOf(Error)

  })

  it('não deve atualizar um cliente com email ja em uso', async () => {
    const clientes = Array.from({ length: 2 }).map(item => makeCliente())

    for (const cliente of clientes) {
      await clienteRepository.create(cliente)
    }

    const [cliente1, cliente2] = clientes

    await expect(sut.execute({
      email: cliente2.getEmail().getValor(),
      id: cliente1.getId().toValue(),
      nome: 'Fulano da Silva',
      telefone: '11999999999',
      tipo: 'PF'
    })).rejects.toBeInstanceOf(Error)
  })
})