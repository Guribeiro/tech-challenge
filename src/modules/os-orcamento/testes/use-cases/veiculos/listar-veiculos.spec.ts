import { ListarVeiculosUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/listar-veiculos.js"
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js"
import { makeVeiculo } from "../../factories/make-veiculo.js"

describe('Caso de Uso: Listar Veículos', () => {
  let veiculosRepository: InMemoryVeiculoRepository
  let sut: ListarVeiculosUseCase

  beforeEach(() => {
    veiculosRepository = new InMemoryVeiculoRepository()
    sut = new ListarVeiculosUseCase(veiculosRepository)
  })

  it('deve listar apenas veículos ativos por padrão com paginação padrão', async () => {
    const veiculosAtivos = Array.from({ length: 3 }).map(() => makeVeiculo())

    const veiculoDeletado = makeVeiculo({ deletadoEm: new Date() })

    for (const veiculo of [...veiculosAtivos, veiculoDeletado]) {
      await veiculosRepository.create(veiculo)
    }

    const result = await sut.execute({})

    expect(result.isRight()).toBe(true)
    expect(result.value.veiculos).toHaveLength(3)
    expect(result.value.total).toBe(3)
    expect(result.value.pagina).toBe(1)
    expect(result.value.limite).toBe(10)
  })

  it('deve permitir paginar a listagem de veículos', async () => {
    for (let i = 1; i <= 15; i++) {
      await veiculosRepository.create(
        makeVeiculo({
          criadoEm: new Date(2026, 0, i),
        })
      )
    }

    const result = await sut.execute({
      pagina: 2,
      limite: 5,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.veiculos).toHaveLength(5)
    expect(result.value.total).toBe(15)
    expect(result.value.pagina).toBe(2)
  })

  it('deve filtrar veículos deletados (soft delete)', async () => {
    const veiculoAtivo = makeVeiculo()
    const veiculoDeletado1 = makeVeiculo({ deletadoEm: new Date() })
    const veiculoDeletado2 = makeVeiculo({ deletadoEm: new Date() })

    await veiculosRepository.create(veiculoAtivo)
    await veiculosRepository.create(veiculoDeletado1)
    await veiculosRepository.create(veiculoDeletado2)

    const result = await sut.execute({
      status: 'deletados',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.veiculos).toHaveLength(2)
    expect(result.value.total).toBe(2)
    expect(result.value.veiculos.map(veiculo => veiculo.getId().toValue())).toEqual([
      veiculoDeletado1.getId().toValue(),
      veiculoDeletado2.getId().toValue()
    ])
  })

  it('deve listar todos os veículos (ativos e deletados) quando status for "todos"', async () => {
    const veiculoAtivo = makeVeiculo()
    const veiculoDeletado = makeVeiculo({ deletadoEm: new Date() })

    await veiculosRepository.create(veiculoAtivo)
    await veiculosRepository.create(veiculoDeletado)

    const result = await sut.execute({
      status: 'todos',
    })
    expect(result.isRight()).toBe(true)
    expect(result.value.veiculos).toHaveLength(2)
    expect(result.value.total).toBe(2)
  })
})