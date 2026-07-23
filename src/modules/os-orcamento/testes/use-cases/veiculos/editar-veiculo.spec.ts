import { EditarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/editar-veiculo.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";

describe('Caso de Uso: Editar Veiculo', () => {
  let sut: EditarVeiculoUseCase
  let veiculoRepository: InMemoryVeiculoRepository

  beforeEach(() => {
    veiculoRepository = new InMemoryVeiculoRepository()
    sut = new EditarVeiculoUseCase(veiculoRepository)
  })

  it('deve editar um veiculo', async () => {
    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const output = await sut.execute({
      id: veiculo.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
      placa: 'ABC1B34',
    })

    expect(output.veiculo.getId().toValue()).toBe(veiculo.getId().toValue())
    expect(output.veiculo.getAno()).toBe(2024)
    expect(output.veiculo.getModelo()).toBe('Modelo')
    expect(output.veiculo.getCor()).toBe('Azul')
    expect(output.veiculo.getPlaca().getValor()).toBe('ABC1B34')
  })

  it('nao deve editar um veiculo inexistente', async () => {
    const veiculo = makeVeiculo()

    await expect(sut.execute({
      id: veiculo.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
    })
    ).rejects.toBeInstanceOf(Error)
  })

  it('nao deve editar um veiculo com a mesma placa de outro', async () => {
    const veiculos = Array.from({ length: 2 }).map(item => makeVeiculo())

    for (const veiculo of veiculos) {
      veiculoRepository.create(veiculo)
    }

    const [veiculo1, veiculo2] = veiculos

    await expect(sut.execute({
      id: veiculo1.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
      placa: veiculo2.getPlaca().getValor(),
    })
    ).rejects.toBeInstanceOf(Error)
  })
})