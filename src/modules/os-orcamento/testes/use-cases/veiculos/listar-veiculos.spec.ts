import { ListarVeiculosUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/listar-veiculos.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";

describe('Caso de Uso: Litar Veiculos', () => {
  let sut: ListarVeiculosUseCase
  let veiculosRepository: InMemoryVeiculoRepository

  beforeEach(() => {
    veiculosRepository = new InMemoryVeiculoRepository()
    sut = new ListarVeiculosUseCase(veiculosRepository)
  })

  it('deve listar os veiculos', async () => {
    const makeVeiculos = Array.from({ length: 5 }).map(item => makeVeiculo())

    for (const veiculo of makeVeiculos) {
      veiculosRepository.create(veiculo)
    }

    const { veiculos } = await sut.executar()

    expect(veiculos).toHaveLength(5)
  })
})