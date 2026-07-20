import { CriarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/criar-veiculo.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";
import { Placa } from "@/modules/os-orcamento/domain/entities/value-objects/placa.js";

describe('Caso de Uso: Criar veiculo', () => {
  let sut: CriarVeiculoUseCase
  let veiculosRepository: InMemoryVeiculoRepository

  beforeEach(() => {
    veiculosRepository = new InMemoryVeiculoRepository()
    sut = new CriarVeiculoUseCase(
      veiculosRepository
    )
  })

  it('deve criar veiculo', async () => {
    const { veiculo } = await sut.executar({
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: 'DCU6B67',
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })

    expect(veiculo.getPlaca().getValor()).toBe('DCU6B67')
    expect(veiculo.getAno()).toBe(2026)
  })

  it('não deve criar dois veiculos com a mesma placa', async () => {
    const veiculo = makeVeiculo()
    veiculosRepository.create(veiculo)

    await expect(sut.executar({
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: veiculo.getPlaca().getValor(),
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })).rejects.toBeInstanceOf(Error)
  })
})