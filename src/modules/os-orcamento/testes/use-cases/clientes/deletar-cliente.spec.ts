import { DeletarClienteUseCase } from "@/modules/os-orcamento/application/use-cases/clientes/deletar-cliente.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";

describe('Caso de Uso: Editar Cliente', () => {
  let sut: DeletarClienteUseCase
  let clienteRepository: InMemoryClienteRepository

  beforeEach(() => {
    clienteRepository = new InMemoryClienteRepository()
    sut = new DeletarClienteUseCase(clienteRepository)
  })

  it('deve atualizar um cliente', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const output = await sut.execute({
      id: cliente.getId().toValue()
    })

    expect(output.cliente.isDeletado()).toBe(true)
  })

  it('não deve atualizar um cliente inexistente', async () => {
    const cliente = makeCliente()

    await expect(sut.execute({
      id: cliente.getId().toValue()
    })).rejects.toBeInstanceOf(Error)
  })

})