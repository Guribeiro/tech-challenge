import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js"
import { ConfirmarPagamentoUseCase } from "../../application/use-cases/confirmar-pagamento.js"
import { Fatura } from "../../domain/entities/fatura.js"
import { InMemoryFaturasRepository } from "../repositories/in-memory-fatura-repository.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js"
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js"
import { makeCliente } from "@/modules/os-orcamento/testes/factories/make-cliente.js"
import { makeMecanico } from "@/modules/os-orcamento/testes/factories/make-mecanico.js"
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"


describe('Caso de Uso: Confirmar Pagamento', () => {
  let sut: ConfirmarPagamentoUseCase
  let faturaRepository: InMemoryFaturasRepository
  let ordemServidoRepository: InMemoryOrdemServicoRepository

  beforeEach(() => {
    ordemServidoRepository = new InMemoryOrdemServicoRepository()
    faturaRepository = new InMemoryFaturasRepository()
    sut = new ConfirmarPagamentoUseCase(
      faturaRepository
    )
  })

  it('deve confirmar o pagamento de uma fatura', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const mecanico = makeMecanico()

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-id'),
      descricao: 'descricao',
      prioridade: prioridade,
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      veiculoId: veiculo.getId(),
      eGarantia: false,
      mecanicoId: mecanico.getId()
    })

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      componentes: os.getComponentes().getItems(),
      ordemServicoId: os.getId(),
      servicos: os.getServicos().getItems(),
      status: 'APROVADO',
    })

    const fatura = Fatura.criar({
      ordemServicoId: os.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })

    await faturaRepository.create(fatura)

    const output = await sut.execute({ faturaId: fatura.getId().toValue() })

    expect(output.fatura.getStatus()).toBe('PAGA')
  })

  it('não deve confirmar o pagamento de uma fatura inexistente', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const mecanico = makeMecanico()

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-id'),
      descricao: 'descricao',
      prioridade: prioridade,
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      veiculoId: veiculo.getId(),
      eGarantia: false,
      mecanicoId: mecanico.getId()
    })

    const orcamento = Orcamento.criar({
      clienteId: cliente.getId(),
      componentes: os.getComponentes().getItems(),
      ordemServicoId: os.getId(),
      servicos: os.getServicos().getItems(),
      status: 'APROVADO',
    })

    const fatura = Fatura.criar({
      ordemServicoId: os.getId(),
      valorTotal: orcamento.getValorTotalGeral(),
    })


    await expect(sut.execute({ faturaId: fatura.getId().toValue() })).rejects.toBeInstanceOf(Error)
  })
})