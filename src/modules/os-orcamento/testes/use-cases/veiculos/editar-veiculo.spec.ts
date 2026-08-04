import { EditarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/editar-veiculo.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";
import { PlacaJaCadastradaError } from "@/core/errors/placa-ja-cadastrada.js";

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

    const result = await sut.execute({
      id: veiculo.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
      placa: 'ABC1B34',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.veiculo.getId().toValue()).toBe(veiculo.getId().toValue())
      expect(result.value.veiculo.getAno()).toBe(2024)
      expect(result.value.veiculo.getModelo()).toBe('Modelo')
      expect(result.value.veiculo.getCor()).toBe('Azul')
      expect(result.value.veiculo.getPlaca().getValor()).toBe('ABC1B34')
    }
  })

  it('nao deve editar um veiculo inexistente', async () => {
    const veiculo = makeVeiculo()

    const result = await sut.execute({
      id: veiculo.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('nao deve editar um veiculo com a mesma placa de outro', async () => {
    const veiculos = Array.from({ length: 2 }).map(item => makeVeiculo())

    for (const veiculo of veiculos) {
      veiculoRepository.create(veiculo)
    }

    const [veiculo1, veiculo2] = veiculos

    const result = await sut.execute({
      id: veiculo1.getId().toValue(),
      ano: 2024,
      modelo: 'Modelo',
      cor: 'Azul',
      placa: veiculo2.getPlaca().getValor(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PlacaJaCadastradaError)
  })
})