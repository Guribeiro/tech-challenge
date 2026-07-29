import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";
import { DeletarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/deletar-veiculo.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";

describe('Caso de Uso: Deletar Veiculo', () => {
  let sut: DeletarVeiculoUseCase
  let veiculosRepository: InMemoryVeiculoRepository

  beforeEach(() => {
    veiculosRepository = new InMemoryVeiculoRepository()
    sut = new DeletarVeiculoUseCase(veiculosRepository)
  })

  it('deve deletar veiculo', async () => {
    const veiculos = Array.from({ length: 2 }).map(item => makeVeiculo())

    for (const veiculo of veiculos) {
      veiculosRepository.create(veiculo)
    }

    const [veiculo1] = veiculos

    const result = await sut.execute({ id: veiculo1.getId().toValue() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.veiculo.isDeletado()).toBe(true)
    }
  })

  it('não deve deletar veiculo já deletado', async () => {
    const veiculo = makeVeiculo({ deletadoEm: new Date() })

    const result = await sut.execute({ id: veiculo.getId().toValue() })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })
})