import { InMemoryNotificacaoService } from '@/modules/notificacoes/testes/services/in-memory-notificacao-service.js'
import { CriaOrdemServicoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js'
import { makeCliente } from '@/modules/os-orcamento/testes/factories/make-cliente.js'
import { makeServico } from '@/modules/os-orcamento/testes/factories/make-servico.js'
import { makeVeiculo } from '@/modules/os-orcamento/testes/factories/make-veiculo.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'
import { InMemoryMecanicosRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordens-servico-repository.js'
import { InMemoryServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-servico-repository.js'
import { InMemoryVeiculoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-veiculo-repository.js'

let notificacaoService: InMemoryNotificacaoService
let ordemServicoRepository: InMemoryOrdemServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let servicoRepository: InMemoryServicoRepository
let sut: CriaOrdemServicoUseCase


describe('Criar ordem de servico', () => {
  beforeEach(() => {
    notificacaoService = new InMemoryNotificacaoService()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()

    sut = new CriaOrdemServicoUseCase(
      clienteRepository,
      veiculoRepository,
      servicoRepository
    )
  })


  it('deve criar ordem de servico', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const { ordemServico } = await sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId().toValue(),
    })

    expect(ordemServico.getClienteId().toValue()).toBe(cliente.getId().toValue())
    expect(ordemServico.getVeiculoId().toValue()).toBe(veiculo.getId().toValue())
  })

  it('deve criar ordem de servico informando servicos', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    await servicoRepository.create(servico)

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
    })

    const { ordemServico } = await sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId().toValue(),
      servicos: [osServicos]
    })

    expect(ordemServico.getClienteId().toValue()).toBe(cliente.getId().toValue())
    expect(ordemServico.getVeiculoId().toValue()).toBe(veiculo.getId().toValue())
    expect(ordemServico.getServicos().getItems()).toHaveLength(1)
  })


  it('não deve criar ordem de servico quando o veiculo não existir', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await expect(sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId().toValue(),
    })).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar ordem de servico quando o cliente não existir', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    await expect(sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId().toValue(),
    })).rejects.toBeInstanceOf(Error)
  })

  it('não deve criar ordem de servico quando algum servico adicionado não existir', async () => {
    const cliente = makeCliente()

    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
    })

    await expect(sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veiculo com problemas na eletrica',
      veiculoId: veiculo.getId().toValue(),
      servicos: [osServicos]
    })).rejects.toBeInstanceOf(Error)

  })
})
