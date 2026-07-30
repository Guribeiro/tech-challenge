import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { makeServico } from '../../factories/make-servico.js'
import { ReativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/reativar-servico.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'

describe('Caso de Uso: Reativar Serviço', () => {
  let servicoRepository: InMemoryServicoRepository
  let sut: ReativarServicoUseCase

  beforeEach(() => {
    servicoRepository = new InMemoryServicoRepository()
    sut = new ReativarServicoUseCase(servicoRepository)
  })

  it('deve reativar um serviço desativado com sucesso', async () => {
    const servico = makeServico({
      desativadoEm: new Date(),
    })
    await servicoRepository.create(servico)

    const result = await sut.execute({
      servicoId: servico.getId().toValue(),
    })

    expect(result.isRight()).toBe(true)
    expect(servicoRepository.servicos[0].getDesativadoEm()).toBeNull()
  })

  it('não deve reativar um serviço inexistente', async () => {
    const result = await sut.execute({
      servicoId: 'id-inexistente',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })
})