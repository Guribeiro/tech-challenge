import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { makeServico } from '../../factories/make-servico.js'
import { ReativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/reativar-servico.js'

describe('Caso de Uso: Reativar Serviço', () => {
  let servicoRepository: InMemoryServicoRepository
  let sut: ReativarServicoUseCase

  beforeEach(() => {
    servicoRepository = new InMemoryServicoRepository()
    sut = new ReativarServicoUseCase(servicoRepository)
  })

  it('deve reativar um serviço desativado com sucesso', async () => {
    // Cria um serviço desativado
    const servico = makeServico({
      desativadoEm: new Date(),
    })
    await servicoRepository.create(servico)

    const output = await sut.execute({
      servicoId: servico.getId().toValue(),
    })

    expect(output.servico.getDesativadoEm()).toBeNull()
    expect(servicoRepository.servicos[0].getDesativadoEm()).toBeNull()
  })

  it('não deve reativar um serviço inexistente', async () => {
    await expect(
      sut.execute({
        servicoId: 'id-inexistente',
      }),
    ).rejects.toThrow('Servico não encontrado')
  })
})