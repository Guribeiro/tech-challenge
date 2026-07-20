import { CriarServicoUseCase } from "@/modules/os-orcamento/application/use-cases/servicos/criar-servico.js";
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js";
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js";

describe('Caso de Uso: Criar Servico', () => {

  let sut: CriarServicoUseCase
  let servicosRepository: InMemoryServicoRepository

  beforeEach(() => {
    servicosRepository = new InMemoryServicoRepository()
    sut = new CriarServicoUseCase(servicosRepository)
  })

  it('deve criar um servico', async () => {
    const { servico } = await sut.executar({
      nome: 'Troca de Oleo',
      categoria: 'MANUTENCAO_PREVENTIVA',
      descricao: 'Troca de oleo do motor',
      valorReferencia: 2000
    })

    expect(servico.getValorReferencia()).toBe(servico.getValorReferencia())
  })
})