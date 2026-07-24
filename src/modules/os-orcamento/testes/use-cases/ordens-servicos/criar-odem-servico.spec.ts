import { CriarOrdemServicoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { InMemoryClienteRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-cliente-repository.js'
import { InMemoryOrdemServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js'
import { InMemoryServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-servico-repository.js'
import { InMemoryVeiculoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-veiculo-repository.js'
import { makeProduto } from '@/modules/estoque/testes/factories/make-produto.js'
import { makeCliente } from '@/modules/os-orcamento/testes/factories/make-cliente.js'
import { makeServico } from '@/modules/os-orcamento/testes/factories/make-servico.js'
import { makeVeiculo } from '@/modules/os-orcamento/testes/factories/make-veiculo.js'

describe('Criar ordem de serviço', () => {
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let servicoRepository: InMemoryServicoRepository
  let produtoRepository: InMemoryProdutoRepository
  let sut: CriarOrdemServicoUseCase

  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    produtoRepository = new InMemoryProdutoRepository()

    sut = new CriarOrdemServicoUseCase(
      clienteRepository,
      veiculoRepository,
      produtoRepository,
      servicoRepository,
      ordemServicoRepository,
    )
    vi.clearAllMocks()
  })

  it('deve criar ordem de serviço simples', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const { ordemServico } = await sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Veículo com barulho na suspensão',
      veiculoId: veiculo.getId().toValue(),
    })

    expect(ordemServico.getClienteId().toValue()).toBe(cliente.getId().toValue())
    expect(ordemServico.getVeiculoId().toValue()).toBe(veiculo.getId().toValue())
    expect(ordemServicoRepository.items).toHaveLength(1)
  })

  it('deve criar ordem de serviço informando serviços', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const servico = makeServico({ nome: 'Troca de óleo' })
    await servicoRepository.create(servico)

    const { ordemServico } = await sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Manutenção preventiva',
      veiculoId: veiculo.getId().toValue(),
      servicos: [{ servicoId: servico.getId().toValue() }],
    })

    expect(ordemServico.getServicos().getItems()).toHaveLength(1)
    expect(ordemServico.getServicos().getItems()[0].getServicoId().toValue()).toBe(
      servico.getId().toValue(),
    )
  })

  it('deve criar ordem de serviço informando componentes/produtos', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const produto = makeProduto({ quantidadeEstoque: 10, precoUnitario: 150, precoCusto: 100 })
    await produtoRepository.create(produto)

    const { ordemServico } = await sut.execute({
      clienteId: cliente.getId().toValue(),
      eGarantia: false,
      descricao: 'Substituição de peça gasta',
      veiculoId: veiculo.getId().toValue(),
      componentes: [
        {
          produtoId: produto.getId().toValue(),
          quantidade: 2,
        },
      ],
    })

    expect(ordemServico.getComponentes().getItems()).toHaveLength(1)
    expect(
      ordemServico.getComponentes().getItems()[0].getQuantidade(),
    ).toBe(2)
    expect(
      ordemServico.getComponentes().getItems()[0].getPrecoUnitario(),
    ).toBe(150)
  })

  it('não deve criar ordem de serviço quando o veículo não existir', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()

    await expect(
      sut.execute({
        clienteId: cliente.getId().toValue(),
        eGarantia: false,
        descricao: 'Veículo não cadastrado',
        veiculoId: veiculo.getId().toValue(),
      }),
    ).rejects.toThrow(`Veículo com ID ${veiculo.getId().toValue()} não encontrado.`)
  })

  it('não deve criar ordem de serviço quando o cliente não existir', async () => {
    const cliente = makeCliente()
    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    await expect(
      sut.execute({
        clienteId: cliente.getId().toValue(),
        eGarantia: false,
        descricao: 'Cliente inexistente',
        veiculoId: veiculo.getId().toValue(),
      }),
    ).rejects.instanceOf(Error)
  })

  it('não deve criar ordem de serviço quando algum serviço adicionado não existir', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    await expect(
      sut.execute({
        clienteId: cliente.getId().toValue(),
        eGarantia: false,
        descricao: 'Serviço inexistente',
        veiculoId: veiculo.getId().toValue(),
        servicos: [{ servicoId: 'servico-inexistente-id' }],
      }),
    ).rejects.instanceOf(Error)
  })

  it('não deve criar ordem de serviço quando estoque de um componente for insuficiente', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    const produto = makeProduto({ quantidadeEstoque: 1, nome: 'Filtro de Ar', quantidadeReservada: 0 })
    await produtoRepository.create(produto)

    await expect(
      sut.execute({
        clienteId: cliente.getId().toValue(),
        eGarantia: false,
        descricao: 'Troca de filtro',
        veiculoId: veiculo.getId().toValue(),
        componentes: [
          {
            produtoId: produto.getId().toValue(),
            quantidade: 5, // Pedindo mais do que o estoque disponível
          },
        ],
      }),
    ).rejects.instanceOf(Error)
  })
})