import { RegraDeNegocioVioladaError } from '@/core/errors/domain-errors/regra-de-negocio-violada-error.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { DesativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/desativar-servico.js'
import { makeServico } from '@/modules/os-orcamento/testes/factories/make-servico.js'
import { InMemoryServicoRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-servico-repository.js'

describe('Caso de Uso: Desativar Serviço', () => {
  let servicoRepository: InMemoryServicoRepository
  let sut: DesativarServicoUseCase

  beforeEach(() => {
    servicoRepository = new InMemoryServicoRepository()
    sut = new DesativarServicoUseCase(servicoRepository)
  })

  it('deve desativar um serviço ativo com sucesso', async () => {
    const servico = makeServico()
    await servicoRepository.create(servico)

    const result = await sut.execute({
      servicoId: servico.getId().toValue(),
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.servico.getDesativadoEm()).toBeInstanceOf(Date)
      expect(servicoRepository.servicos[0].getDesativadoEm()).toBeInstanceOf(Date)
    }
  })

  it('não deve desativar um serviço inexistente', async () => {
    const result = await sut.execute({
      servicoId: 'id-inexistente',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)

  })

  it('não deve desativar um serviço que já está desativado', async () => {
    const servico = makeServico({
      desativadoEm: new Date(),
    })

    await servicoRepository.create(servico)

    const result = await sut.execute({
      servicoId: servico.getId().toValue(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RegraDeNegocioVioladaError)
  })
})