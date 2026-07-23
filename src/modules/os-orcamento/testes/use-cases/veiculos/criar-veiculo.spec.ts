import { CriarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/criar-veiculo.js";
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js";
import { makeVeiculo } from "../../factories/make-veiculo.js";
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js";
import { makeCliente } from "../../factories/make-cliente.js";

describe('Caso de Uso: Criar veiculo', () => {
  let sut: CriarVeiculoUseCase
  let veiculosRepository: InMemoryVeiculoRepository
  let clienteRepository: InMemoryClienteRepository

  beforeEach(() => {
    veiculosRepository = new InMemoryVeiculoRepository()
    clienteRepository = new InMemoryClienteRepository()
    sut = new CriarVeiculoUseCase(
      clienteRepository,
      veiculosRepository,
    )
  })

  it('deve criar veiculo', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const { veiculo } = await sut.execute({
      clienteId: cliente.getId().toValue(),
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
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    veiculosRepository.create(veiculo)

    await expect(sut.execute({
      clienteId: cliente.getId().toValue(),
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: veiculo.getPlaca().getValor(),
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar um veiculo com um cliente inexistente', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()
    veiculosRepository.create(veiculo)

    await expect(sut.execute({
      clienteId: cliente.getId().toValue(),
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