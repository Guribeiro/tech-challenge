import { DeletarClienteUseCase } from "@/modules/os-orcamento/application/use-cases/clientes/deletar-cliente.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";

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

    const result = await sut.execute({
      id: cliente.getId().toValue()
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.isDeletado()).toBe(true)
    }
  })

  it('não deve deletar um cliente inexistente', async () => {
    const cliente = makeCliente()

    const result = await sut.execute({
      id: cliente.getId().toValue()
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
    }
  })

})