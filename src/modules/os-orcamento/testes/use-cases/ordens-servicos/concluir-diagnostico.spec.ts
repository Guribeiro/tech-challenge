import { ConcluirDiagnosticoUseCase } from "@/modules/os-orcamento/application/use-cases/ordens-servicos/concluir-diagnostico.js"
import { InMemoryOrdemServicoRepository } from "../../repositories/in-memory-ordem-servico-repository.js"
import { InMemoryOrcamentoRepository } from "../../repositories/in-memory-orcamento-repository.js"
import { InMemoryClienteRepository } from "../../repositories/in-memory-cliente-repository.js"
import { InMemoryVeiculoRepository } from "../../repositories/in-memory-veiculo-repository.js"
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { makeServico } from "../../factories/make-servico.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { OrdemServicoServicoList } from "@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js"
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js"
import { InMemoryProdutoRepository } from "@/modules/estoque/testes/repositories/in-memory-produto-repository.js"
import { InMemoryUsuariosRepository } from "@/modules/autenticacao/testes/repositories/in-memory-users-repository.js"
import { makeUsuario } from "@/modules/autenticacao/testes/factories/make-usuario.js"
import { makeProduto } from "@/modules/estoque/testes/factories/make-produto.js"
import { makeOrdemServico } from "../../factories/make-ordem-servico.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { ConcluirDiagnosticoService } from "@/modules/os-orcamento/domain/services/concluir-diagnostico.service.js"

let ordemServicoRepository: InMemoryOrdemServicoRepository
let orcamentoRepository: InMemoryOrcamentoRepository
let clienteRepository: InMemoryClienteRepository
let veiculoRepository: InMemoryVeiculoRepository
let produtoRepository: InMemoryProdutoRepository
let servicoRepository: InMemoryServicoRepository
let mecanicoRepository: InMemoryMecanicosRepository
let usuarioRepository: InMemoryUsuariosRepository
let concluirDiagnosticoService: ConcluirDiagnosticoService

let sut: ConcluirDiagnosticoUseCase

describe('Concluir Diagnóstico Use Case', () => {
  beforeEach(() => {
    ordemServicoRepository = new InMemoryOrdemServicoRepository()
    orcamentoRepository = new InMemoryOrcamentoRepository()
    clienteRepository = new InMemoryClienteRepository()
    veiculoRepository = new InMemoryVeiculoRepository()
    servicoRepository = new InMemoryServicoRepository()
    produtoRepository = new InMemoryProdutoRepository()
    mecanicoRepository = new InMemoryMecanicosRepository()
    usuarioRepository = new InMemoryUsuariosRepository()

    concluirDiagnosticoService = new ConcluirDiagnosticoService(
      servicoRepository,
      produtoRepository,
    )

    sut = new ConcluirDiagnosticoUseCase(
      ordemServicoRepository,
      usuarioRepository,
      concluirDiagnosticoService
    )
  })

  it('deve concluir o diagnóstico com sucesso pelo mecânico responsável', async () => {
    const usuarioMecanico = makeUsuario({ role: 'MECANICO' })
    await usuarioRepository.create(usuarioMecanico)

    const servicoInicial = makeServico({ nome: 'Alinhamento' })
    await servicoRepository.create(servicoInicial)

    const novoServico = makeServico({ nome: 'Balanceamento' })
    await servicoRepository.create(novoServico)

    const novoProduto = makeProduto({ nome: 'Filtro de Ar' })
    await produtoRepository.create(novoProduto)

    const ordemServicoId = new UniqueEntityID()
    const osServico = OrdemServicoServico.criar({
      ordemServicoId,
      servicoId: servicoInicial.getId(),
      precoUnitario: servicoInicial.getValorReferencia(),
      categoria: servicoInicial.getCategoria(),
      nome: servicoInicial.getNome(),
    })

    const ordemServico = makeOrdemServico(
      {
        mecanicoId: usuarioMecanico.getId(),
        servicos: new OrdemServicoServicoList([osServico]),
      },
      ordemServicoId,
    )

    ordemServico.iniciarDiagnostico(usuarioMecanico.getId())
    await ordemServicoRepository.create(ordemServico)

    const result = await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      usuarioId: usuarioMecanico.getId().toValue(),
      servicos: [
        { id: osServico.getId().toValue(), servicoId: servicoInicial.getId().toValue() },
        { servicoId: novoServico.getId().toValue() },
      ],
      componentes: [
        { produtoId: novoProduto.getId().toValue(), quantidade: 2 },
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { ordemServico: osAtualizada } = result.value
      expect(osAtualizada.getServicos().getItems()).toHaveLength(2)
      expect(osAtualizada.getComponentes().getItems()).toHaveLength(1)
      expect(osAtualizada.getComponentes().getItems()[0].getQuantidade()).toBe(2)
      expect(ordemServicoRepository.items[0]).toEqual(osAtualizada)
    }
  })

  it('deve permitir que um usuário ADMIN conclua o diagnóstico mesmo sem ser o mecânico responsável', async () => {
    const usuarioAdmin = makeUsuario({ role: 'ADMIN' })
    await usuarioRepository.create(usuarioAdmin)

    const ordemServico = makeOrdemServico()
    ordemServico.iniciarDiagnostico(new UniqueEntityID())
    await ordemServicoRepository.create(ordemServico)

    const result = await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      usuarioId: usuarioAdmin.getId().toValue(),
    })

    expect(result.isRight()).toBe(true)
  })

  it('não deve permitir que outro mecânico conclua o diagnóstico de uma OS que não pertence a ele', async () => {
    const mecanicoDono = makeUsuario({ role: 'MECANICO' })
    const outroMecanico = makeUsuario({ role: 'MECANICO' })
    await usuarioRepository.create(mecanicoDono)
    await usuarioRepository.create(outroMecanico)

    const ordemServico = makeOrdemServico({
      mecanicoId: mecanicoDono.getId(),
    })

    ordemServico.iniciarDiagnostico(mecanicoDono.getId())
    await ordemServicoRepository.create(ordemServico)

    const result = await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      usuarioId: outroMecanico.getId().toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })

  it('deve retornar RecursoNaoEncontradoError ao tentar associar um produto inexistente', async () => {
    const usuarioMecanico = makeUsuario({ role: 'MECANICO' })
    await usuarioRepository.create(usuarioMecanico)

    const ordemServico = makeOrdemServico({
      mecanicoId: usuarioMecanico.getId(),
    })

    ordemServico.iniciarDiagnostico(usuarioMecanico.getId())
    await ordemServicoRepository.create(ordemServico)

    const result = await sut.execute({
      ordemServicoId: ordemServico.getId().toValue(),
      usuarioId: usuarioMecanico.getId().toValue(),
      componentes: [{ produtoId: 'produto-inexistente', quantidade: 1 }],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('deve retornar RecursoNaoEncontradoError se a Ordem de Serviço não for encontrada', async () => {
    const usuario = makeUsuario()
    await usuarioRepository.create(usuario)

    const result = await sut.execute({
      ordemServicoId: 'os-inexistente',
      usuarioId: usuario.getId().toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })
})