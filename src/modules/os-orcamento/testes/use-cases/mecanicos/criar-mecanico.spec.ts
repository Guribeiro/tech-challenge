import { CriarMecanicoUseCase } from "@/modules/os-orcamento/application/use-cases/mecanicos/criar-mecanico.js"
import { InMemoryMecanicosRepository } from "../../repositories/in-memory-mecanicos-repository.js"
import { makeMecanico } from "../../factories/make-mecanico.js"
import { EmailJaCadastradoError } from "@/core/errors/email-ja-cadastrado-error.js"
import { CpfJaCadastradoError } from "@/core/errors/cpf-ja-cadastrado.js"

describe('Caso de Uso: Criar Mecânico', () => {
  let sut: CriarMecanicoUseCase
  let mecanicoRepository: InMemoryMecanicosRepository

  beforeEach(() => {
    mecanicoRepository = new InMemoryMecanicosRepository()
    sut = new CriarMecanicoUseCase(mecanicoRepository)
  })

  it('deve criar mecânico', async () => {
    const mecanico = makeMecanico()
    const result = await sut.execute({
      cpf: mecanico.getCpf().getValor(),
      email: mecanico.getEmail().getValor(),
      nome: mecanico.getNome().getValor(),
      especialidade: mecanico.getEspecialidade()
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(mecanicoRepository.mecanicos).toContainEqual(result.value.mecanico)
    }
  })

  it('não deve criar mecânico com um email já em uso', async () => {
    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const result = await sut.execute({
      cpf: mecanico.getCpf().getValor(),
      email: mecanico.getEmail().getValor(),
      nome: mecanico.getNome().getValor(),
      especialidade: mecanico.getEspecialidade()
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailJaCadastradoError)
  })

  it('não deve criar mecânico com um cpf já em uso', async () => {
    const mecanico = makeMecanico()

    await mecanicoRepository.create(mecanico)

    const result = await sut.execute({
      cpf: mecanico.getCpf().getValor(),
      email: 'mecanico@email.com',
      nome: mecanico.getNome().getValor(),
      especialidade: mecanico.getEspecialidade()
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CpfJaCadastradoError)
  })
})