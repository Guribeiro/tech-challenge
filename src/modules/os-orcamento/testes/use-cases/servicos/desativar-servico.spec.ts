import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { makeServico } from '../../factories/make-servico.js'
import { DesativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/desativar-servico.js'

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

    const output = await sut.execute({
      servicoId: servico.getId().toValue(),
    })

    expect(output.servico.getDesativadoEm()).toBeInstanceOf(Date)
    expect(servicoRepository.servicos[0].getDesativadoEm()).toBeInstanceOf(Date)
  })

  it('não deve desativar um serviço inexistente', async () => {
    await expect(
      sut.execute({
        servicoId: 'id-inexistente',
      }),
    ).rejects.toThrow('Servico não encontrado')
  })

  it('não deve desativar um serviço que já está desativado', async () => {
    const servico = makeServico({
      desativadoEm: new Date(),
    })

    await servicoRepository.create(servico)

    await expect(
      sut.execute({
        servicoId: servico.getId().toValue(),
      }),
    ).rejects.instanceOf(Error)
  })
})