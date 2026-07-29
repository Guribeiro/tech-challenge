import { PlacaJaCadastradaError } from "@/core/errors/placa-ja-cadastrada.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";
import { CriarVeiculoUseCase } from "@/modules/os-orcamento/application/use-cases/veiculos/criar-veiculo.js";
import { makeCliente } from "@/modules/os-orcamento/testes/factories/make-cliente.js";
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js";
import { InMemoryClienteRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js";
import { InMemoryVeiculoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-veiculo-repository.js";

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

    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: 'DCU6B67',
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.veiculo.getPlaca().getValor()).toBe('DCU6B67')
      expect(result.value.veiculo.getAno()).toBe(2026)
    }
  })

  it('não deve criar dois veiculos com a mesma placa', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    veiculosRepository.create(veiculo)

    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: veiculo.getPlaca().getValor(),
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PlacaJaCadastradaError)
  })

  it('não deve criar um veiculo com um cliente inexistente', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()
    veiculosRepository.create(veiculo)

    const result = await sut.execute({
      clienteId: cliente.getId().toValue(),
      ano: 2026,
      marca: 'FIAT',
      modelo: 'Modelo',
      placa: veiculo.getPlaca().getValor(),
      combustivel: 'gasolina',
      cor: 'preto',
      quilometragem: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })


})