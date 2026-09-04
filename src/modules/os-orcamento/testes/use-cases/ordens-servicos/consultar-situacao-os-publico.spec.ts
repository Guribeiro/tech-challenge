import { ConsultarSituacaoOSPublicoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/consultar-situacao-os-publico.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js"
import { makeCliente } from "../../factories/make-cliente.js"
import { makeVeiculo } from "../../factories/make-veiculo.js"
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js"
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordem-servico-repository.js"
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js"
import { Placa } from "@/modules/os-orcamento/domain/entities/value-objects/placa.js"

describe('Consultar situação de OS público', () => {
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let sut: ConsultarSituacaoOSPublicoUseCase

  beforeEach(() => {
    vi.clearAllMocks()

    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()

    sut = new ConsultarSituacaoOSPublicoUseCase(
      ordemServicoRepository,
      clienteRepository,
      veiculoRepository,
    )
  })

  it('deve poder consultar a situação da OS publicamente informando a placa do veículo e o documento do cliente', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo({
      placa: Placa.criar('ABC1234'),
    })
    await veiculoRepository.create(veiculo)

    const ordemServico = OrdemServico.criar({
      clienteId: cliente.getId(),
      veiculoId: veiculo.getId(),
      descricao: 'Ordem de serviço pública',
      status: 'RECEBIDA',
      eGarantia: false,
      servicos: new OrdemServicoServicoList(),
      componentes: new OrdemServicoComponenteList(),
      prioridade: Prioridade.calcular({
        eGarantia: false,
        eClienteCorporativo: cliente.getTipo() === 'PJ',
        anoVeiculo: veiculo.getAno(),
        categoriasDosServicos: [],
      }),
    })

    await ordemServicoRepository.create(ordemServico)

    const result = await sut.execute({
      placa: 'ABC1234',
      documento: cliente.getDocumento().getValor(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.ordemServico.getId().equals(ordemServico.getId())).toBe(true)
      expect(result.value.ordemServico.getStatus()).toBe('RECEBIDA')
    }
  })

  it('não deve poder consultar a situação da OS se o cliente não for encontrado', async () => {
    const veiculo = makeVeiculo({
      placa: Placa.criar('ABC1234'),
    })
    await veiculoRepository.create(veiculo)

    const result = await sut.execute({
      placa: 'ABC1234',
      documento: '00000000000',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toEqual(expect.objectContaining({
      message: expect.stringContaining('Cliente'),
    }))
  })

  it('não deve poder consultar a situação da OS se o veículo não for encontrado', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const result = await sut.execute({
      placa: 'XXX9999',
      documento: cliente.getDocumento().getValor(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toEqual(expect.objectContaining({
      message: expect.stringContaining('Veículo'),
    }))
  })

  it('não deve poder consultar a situação da OS se a ordem de serviço não for encontrada para o cliente e veículo informados', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo({
      placa: Placa.criar('ABC1234'),
    })
    await veiculoRepository.create(veiculo)

    const result = await sut.execute({
      placa: 'ABC1234',
      documento: cliente.getDocumento().getValor(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toEqual(expect.objectContaining({
      message: expect.stringContaining('Ordem de Serviço'),
    }))
  })
})