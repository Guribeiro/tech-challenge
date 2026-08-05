import { ListarClientesUseCase } from "@/modules/os-orcamento/application/use-cases/clientes/listar-clientes.js"
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js"
import { makeCliente } from "../../factories/make-cliente.js"
import { NomeCompleto } from "@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js"

describe('Caso de Uso: Listar Clientes', () => {
  let clientesRepository: InMemoryClienteRepository
  let sut: ListarClientesUseCase

  beforeEach(() => {
    clientesRepository = new InMemoryClienteRepository()
    sut = new ListarClientesUseCase(clientesRepository)
  })

  it('deve listar apenas clientes ativos por padrão com paginação padrão', async () => {
    // Cria 3 clientes ativos
    const clientesAtivos = Array.from({ length: 3 }).map(() => makeCliente())

    // Cria 1 cliente deletado (soft delete)
    const clienteDeletado = makeCliente({ deletadoEm: new Date() })

    for (const cliente of [...clientesAtivos, clienteDeletado]) {
      await clientesRepository.create(cliente)
    }

    const result = await sut.execute({})

    expect(result.isRight()).toBe(true)

    expect(result.value.clientes).toHaveLength(3)
    expect(result.value.total).toBe(3)
    expect(result.value.pagina).toBe(1)
    expect(result.value.limite).toBe(10)
  })

  it('deve permitir paginar a listagem de clientes', async () => {
    // Cria 15 clientes em datas diferentes para garantir a ordem
    for (let i = 1; i <= 15; i++) {
      await clientesRepository.create(
        makeCliente({
          criadoEm: new Date(2026, 0, i),
        })
      )
    }

    // Busca a página 2 com limite de 5 itens por página
    const result = await sut.execute({
      pagina: 2,
      limite: 5,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.clientes).toHaveLength(5)
    expect(result.value.total).toBe(15)
    expect(result.value.pagina).toBe(2)
  })

  it('deve filtrar clientes deletados (soft delete)', async () => {
    const clienteAtivo = makeCliente()
    const clienteDeletado1 = makeCliente({ deletadoEm: new Date() })
    const clienteDeletado2 = makeCliente({ deletadoEm: new Date() })

    await clientesRepository.create(clienteAtivo)
    await clientesRepository.create(clienteDeletado1)
    await clientesRepository.create(clienteDeletado2)

    const result = await sut.execute({
      status: 'deletados',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.clientes).toHaveLength(2)
    expect(result.value.total).toBe(2)
    expect(result.value.clientes.map(cliente => cliente.getId())).toEqual(
      expect.arrayContaining([clienteDeletado1.getId(), clienteDeletado2.getId()])
    )
  })

  it('deve listar todos os clientes (ativos e deletados) quando status for "todos"', async () => {
    const clienteAtivo = makeCliente()
    const clienteDeletado = makeCliente({ deletadoEm: new Date() })

    await clientesRepository.create(clienteAtivo)
    await clientesRepository.create(clienteDeletado)

    const result = await sut.execute({
      status: 'todos',
    })


    expect(result.isRight()).toBe(true)
    expect(result.value.clientes).toHaveLength(2)
    expect(result.value.total).toBe(2)
  })

  it('deve buscar clientes por trecho do nome (case insensitive)', async () => {
    const cliente1 = makeCliente({ nome: NomeCompleto.criar('Carlos Eduardo') })
    const cliente2 = makeCliente({ nome: NomeCompleto.criar('Ana Maria') })
    const cliente3 = makeCliente({ nome: NomeCompleto.criar('Eduardo Silva') })

    await clientesRepository.create(cliente1)
    await clientesRepository.create(cliente2)
    await clientesRepository.create(cliente3)

    const result = await sut.execute({
      nome: 'eduardo', // em minúsculas para testar case-insensitivity
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.clientes).toHaveLength(2)
    expect(result.value.total).toBe(2)
    expect(result.value.clientes.map(cliente => cliente.getNome().getValor())).toEqual(
      expect.arrayContaining([cliente1.getNome().getValor(), cliente3.getNome().getValor(),])
    )
  })
})