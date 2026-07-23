import { ListarClientesUseCase } from "@/modules/os-orcamento/application/use-cases/clientes/listar-clientes.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";

describe('Caso de Uso: Listar Clientes', () => {
  let clientesRepository: InMemoryClienteRepository
  let sut: ListarClientesUseCase

  beforeEach(() => {
    clientesRepository = new InMemoryClienteRepository()
    sut = new ListarClientesUseCase(clientesRepository)
  })

  it('deve listar os clientes', async () => {
    const clientes = Array.from({ length: 5 }).map(item => makeCliente())

    for (const cliente of clientes) {
      clientesRepository.create(cliente)
    }

    const output = await sut.execute()

    expect(output.clientes).toHaveLength(5)
  })
});