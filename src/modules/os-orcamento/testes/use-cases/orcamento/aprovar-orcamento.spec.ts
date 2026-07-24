import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { AprovarOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/aprovar-orcamento.js'

// Repositórios em Memória
import { InMemoryProdutoRepository } from '@/modules/estoque/testes/repositories/in-memory-produto-repository.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordens-servico-repository.js'

// Entidades e Factories (substitua pelos seus caminhos/factories de teste)
import { Orcamento } from '@/modules/os-orcamento/domain/entities/orcamento.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente.js'

// Caso de Uso Auxiliar e Subscribers
import { ReservarProdutosEstoqueUseCase } from '@/modules/estoque/application/use-cases/reservar-produtos-estoque.js'
import { makeProduto } from '@/modules/estoque/testes/factories/make-produto.js'
import { OnClienteAprovouOrcamento } from '@/modules/os-orcamento/application/subscribers/on-orcamento-aprovado.js'
import { OnExecucaoAutorizada } from '@/modules/os-orcamento/application/subscribers/on-os-execucao-autorizada.js'
import { OnProdutosReservados } from '@/modules/os-orcamento/application/subscribers/on-produtos-reservados.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeServico } from '../../factories/make-servico.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { InMemoryClienteRepository } from '../../repositories/in-memory-cliente-repository.js'
import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { InMemoryVeiculoRepository } from '../../repositories/in-memory-veiculo-repository.js'

describe('Caso de Uso: Aprovar Orçamento (Caminho Feliz)', () => {
  let orcamentoRepository: InMemoryOrcamentoRepository
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let produtoRepository: InMemoryProdutoRepository
  let servicoRepository: InMemoryServicoRepository
  let clienteRepository: InMemoryClienteRepository
  let veiculoRepository: InMemoryVeiculoRepository

  // Casos de Uso
  let sut: AprovarOrcamentoUseCase // System Under Test
  let reservarPecasEstoque: ReservarProdutosEstoqueUseCase

  beforeEach(() => {
    // 1. Inicializa repositórios em memória
    orcamentoRepository = new InMemoryOrcamentoRepository()
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    produtoRepository = new InMemoryProdutoRepository()
    servicoRepository = new InMemoryServicoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()

    // 2. Inicializa os Casos de Uso
    reservarPecasEstoque = new ReservarProdutosEstoqueUseCase(produtoRepository)
    sut = new AprovarOrcamentoUseCase(
      orcamentoRepository,
      clienteRepository
    )

    // 3. Registra os Subscribers (Ouvintes) para o teste
    new OnClienteAprovouOrcamento(ordemServicoRepository)
    new OnExecucaoAutorizada(reservarPecasEstoque)
    new OnProdutosReservados(ordemServicoRepository)

    vi.clearAllMocks()
  })

  it('deve aprovar o orçamento, autorizar a OS, reservar os produtos no estoque e deixar a OS pronta para iniciar', async () => {
    const cliente = makeCliente()
    await clienteRepository.create(cliente)

    const produto = makeProduto({ quantidadeEstoque: 10, quantidadeReservada: 0 })
    await produtoRepository.create(produto)

    const servico = makeServico({ nome: 'Troca de óleo' })
    await servicoRepository.create(servico)

    const veiculo = makeVeiculo()
    await veiculoRepository.create(veiculo)

    // Cria componentes da OS associados ao produto cadastrado
    const componenteOS = new OrdemServicoComponente({
      produtoId: produto.getId(),
      quantidade: 2,
      precoUnitario: produto.getPrecoUnitario(),
      tipo: produto.getTipo(),
      descricao: produto.getDescricao()
    })

    const osServicos = new OrdemServicoServico({
      categoria: servico.getCategoria(),
      nome: servico.getNome(),
      precoUnitario: servico.getValorReferencia(),
      servicoId: servico.getId(),
    })

    const prioridade = Prioridade.calcular({
      eGarantia: true,
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [osServicos.getCategoria()]
    });

    // Cria a Ordem de Serviço em estado de diagnóstico aguardando aprovação
    const ordemServico = OrdemServico.criar({
      clienteId: cliente.getId(),
      componentes: new OrdemServicoComponenteList([componenteOS]),
      servicos: new OrdemServicoServicoList([osServicos]),
      prioridade,
      status: 'AGUARDANDO_APROVACAO',
      eGarantia: true,
      veiculoId: veiculo.getId(),
      descricao: 'Algum problema com o veiculo'
    })
    await ordemServicoRepository.create(ordemServico)

    // Cria o orçamento vinculado à OS
    const orcamento = Orcamento.criar({
      ordemServicoId: ordemServico.getId(),
      status: 'ENVIADO',
      clienteId: cliente.getId(),
      componentes: ordemServico.getComponentes().getItems(),
      servicos: ordemServico.getServicos().getItems()
    })
    await orcamentoRepository.save(orcamento)

    // --- ACT (Executar a ação) ---
    const resultado = await sut.execute({
      orcamentoId: orcamento.getId().toValue(),
      clienteId: cliente.getId().toValue()
    })

    // --- ASSERT (Verificar resultados e efeitos colaterais assíncronos) ---
    expect(resultado.orcamento.getId().toValue()).toBe(orcamento.getId().toValue())

    // 1. O Orçamento mudou para APROVADO?
    expect(resultado.orcamento.getStatus()).toBe('APROVADO')

    // 2. O Estoque reservou os produtos corretos? (Tinha 10, reservou 2)
    await vi.waitFor(async () => {
      // 1. O Estoque reservou os produtos corretos?
      const produtoNoEstoque = await produtoRepository.findById(produto.getId().toValue())


      expect(produtoNoEstoque?.getQuantidadeReservada()).toBe(2)

      // 2. A OS passou por toda a esteira e terminou como PRONTA_PARA_INICIAR?
      const osNoBanco = await ordemServicoRepository.findById(ordemServico.getId().toValue())
      expect(osNoBanco?.getStatus()).toBe('PRONTA_PARA_INICIAR')
    }, { timeout: 1000 })
  })


})