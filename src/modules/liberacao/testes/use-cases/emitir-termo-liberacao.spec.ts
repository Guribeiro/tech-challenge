import { EmitirTermoLiberacaoUseCase } from "../../application/use-cases/emitir-termo-liberacao.js";
import { InMemoryOrdemServicoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-ordem-servico-repository.js";
import { InMemoryVeiculoRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-veiculo-repository.js";
import { InMemoryTermoLiberacaoRepository } from "../repositories/in-memory-termo-liberacao-repository.js";
import { makeVeiculo } from "@/modules/os-orcamento/testes/factories/make-veiculo.js"
import { makeCliente } from "@/modules/os-orcamento/testes/factories/make-cliente.js"
import { makeMecanico } from "@/modules/os-orcamento/testes/factories/make-mecanico.js"
import { Prioridade } from "@/modules/os-orcamento/domain/entities/value-objects/prioridade.js";
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { OrdemServicoComponenteList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js";
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js";
import { InMemoryMecanicosRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js";


describe('Caso de Uso: Emitir Termo de Liberação - (PAGAMENTO APROVADO)', () => {
  let sut: EmitirTermoLiberacaoUseCase
  let ordemServicoRepository: InMemoryOrdemServicoRepository
  let veiculoRepository: InMemoryVeiculoRepository
  let termoLiberacaoRepository: InMemoryTermoLiberacaoRepository
  let mecanicoRepository: InMemoryMecanicosRepository


  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    termoLiberacaoRepository = new InMemoryTermoLiberacaoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    sut = new EmitirTermoLiberacaoUseCase(
      ordemServicoRepository,
      veiculoRepository,
      termoLiberacaoRepository
    )
  })

  it('deve emitir o termo de liberação do veiculo', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const mecanico = makeMecanico()

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      descricao: 'descricao',
      prioridade: prioridade,
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      veiculoId: veiculo.getId(),
      eGarantia: false,
      mecanicoId: mecanico.getId()
    })

    await ordemServicoRepository.create(os)

    const { termo } = await sut.execute({
      ordemServicoId: os.getId().toValue()
    })

    expect(termo.getPlacaVeiculo()).toBe(veiculo.getPlaca().getFormatada())
    expect(termo.getMotivo()).toBe('PAGAMENTO_APROVADO')
  })


  it('não deve emitir o termo de liberação de um veiculo inexistente', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      descricao: 'descricao',
      prioridade: prioridade,
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      veiculoId: veiculo.getId(),
      eGarantia: false,
      mecanicoId: mecanico.getId()
    })

    await ordemServicoRepository.create(os)

    await expect(sut.execute({
      ordemServicoId: os.getId().toValue()
    })).rejects.toBeInstanceOf(Error)
  })



  it('não deve emitir o termo de liberação de um mecanico inexistente', async () => {
    const cliente = makeCliente()

    const veiculo = makeVeiculo()

    await veiculoRepository.create(veiculo)

    const mecanico = makeMecanico()

    const prioridade = Prioridade.calcular({
      anoVeiculo: veiculo.getAno(),
      categoriasDosServicos: [],
      eClienteCorporativo: cliente.getTipo() === 'PJ',
      eGarantia: false,
    })

    const os = OrdemServico.criar({
      clienteId: cliente.getId(),
      descricao: 'descricao',
      prioridade: prioridade,
      componentes: new OrdemServicoComponenteList([]),
      servicos: new OrdemServicoServicoList([]),
      veiculoId: veiculo.getId(),
      eGarantia: false,
      mecanicoId: mecanico.getId()
    })


    await expect(sut.execute({
      ordemServicoId: os.getId().toValue()
    })).rejects.toBeInstanceOf(Error)

  })
})