import { ListarServicosUseCase } from "@/modules/os-orcamento/application/use-cases/servicos/listar-servicos.js"
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js"
import { makeServico } from "../../factories/make-servico.js"

describe('Caso de Uso: Listar Produtos', () => {
  let servicoRepository: InMemoryServicoRepository
  let sut: ListarServicosUseCase

  beforeEach(() => {
    servicoRepository = new InMemoryServicoRepository()
    sut = new ListarServicosUseCase(servicoRepository)
  })

  it('deve listar apenas servicos ativos por padrão com paginação padrão', async () => {
    // Cria 3 servicos ativos
    const servicosAtivos = Array.from({ length: 3 }).map(() => makeServico())

    // Cria 1 servico deletado (soft delete)
    const servicoDeletado = makeServico({ desativadoEm: new Date() })

    for (const servico of [...servicosAtivos, servicoDeletado]) {
      await servicoRepository.create(servico)
    }

    const output = await sut.execute({})

    expect(output.servicos).toHaveLength(3)
    expect(output.total).toBe(3)
    expect(output.pagina).toBe(1)
    expect(output.limite).toBe(10)
  })

  it('deve permitir paginar a listagem de servicos', async () => {
    // Cria 15 servicos em datas diferentes para garantir a ordem
    for (let i = 1; i <= 15; i++) {
      await servicoRepository.create(
        makeServico({
          criadoEm: new Date(2026, 0, i),
        })
      )
    }

    // Busca a página 2 com limite de 5 itens por página
    const output = await sut.execute({
      pagina: 2,
      limite: 5,
    })

    expect(output.servicos).toHaveLength(5)
    expect(output.total).toBe(15)
    expect(output.pagina).toBe(2)
  })

  it('deve filtrar servicos deletados (soft delete)', async () => {
    const servicoAtivo = makeServico()
    const servicoDeletado1 = makeServico({ desativadoEm: new Date() })
    const servicoDeletado2 = makeServico({ desativadoEm: new Date() })

    await servicoRepository.create(servicoAtivo)
    await servicoRepository.create(servicoDeletado1)
    await servicoRepository.create(servicoDeletado2)

    const output = await sut.execute({
      status: 'deletados',
    })

    expect(output.servicos).toHaveLength(2)
    expect(output.total).toBe(2)
    expect(output.servicos.map(servico => servico.getId())).toEqual([
      servicoDeletado1.getId(),
      servicoDeletado2.getId()
    ])
  })

  it('deve listar todos os servicos (ativos e deletados) quando status for "todos"', async () => {
    const servicoAtivo = makeServico()
    const servicoDeletado = makeServico({ desativadoEm: new Date() })

    await servicoRepository.create(servicoAtivo)
    await servicoRepository.create(servicoDeletado)

    const output = await sut.execute({
      status: 'todos',
    })

    expect(output.servicos).toHaveLength(2)
    expect(output.total).toBe(2)
  })

  it('deve buscar servicos por trecho do nome (case insensitive)', async () => {
    const servico1 = makeServico({ nome: 'Carlos Eduardo' })
    const servico2 = makeServico({ nome: 'Ana Maria' })
    const servico3 = makeServico({ nome: 'Eduardo Silva' })

    await servicoRepository.create(servico1)
    await servicoRepository.create(servico2)
    await servicoRepository.create(servico3)

    const output = await sut.execute({
      nome: 'eduardo', // em minúsculas para testar case-insensitivity
    })

    expect(output.servicos).toHaveLength(2)
    expect(output.total).toBe(2)

    expect(output.servicos.map(servico => servico.getNome())).toEqual([
      servico1.getNome(),
      servico3.getNome(),
    ])
  })
})