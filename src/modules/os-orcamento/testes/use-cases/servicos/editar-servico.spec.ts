import { InMemoryServicoRepository } from '../../repositories/in-memory-servico-repository.js'
import { makeServico } from '../../factories/make-servico.js'
import { EditarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/editar-servico.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

describe('Caso de Uso: Editar Serviço', () => {
  let servicoRepository: InMemoryServicoRepository
  let sut: EditarServicoUseCase

  beforeEach(() => {
    servicoRepository = new InMemoryServicoRepository()
    sut = new EditarServicoUseCase(servicoRepository)
  })

  it('deve editar um serviço com sucesso', async () => {
    const servico = makeServico({
      nome: 'Alinhamento Simples',
      categoria: 'MECANICA_GERAL',
      descricao: 'Descrição antiga',
      valorReferencia: 100,
    })

    await servicoRepository.create(servico)

    const result = await sut.execute({
      id: servico.getId().toValue(),
      nome: 'Alinhamento e Balanceamento Completo',
      categoria: 'MANUTENCAO_PREVENTIVA',
      descricao: 'Descrição atualizada',
      valorReferencia: 150,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.servico.getNome()).toBe('Alinhamento e Balanceamento Completo')
      expect(result.value.servico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA')
      expect(result.value.servico.getDescricao()).toBe('Descrição atualizada')
      expect(result.value.servico.getValorReferencia()).toBe(150)
      expect(result.value.servico.getAtualizadoEm()).toBeInstanceOf(Date)


      expect(servicoRepository.servicos[0].getNome()).toBe('Alinhamento e Balanceamento Completo')
      expect(servicoRepository.servicos[0].getValorReferencia()).toBe(150)
    }
  })

  it('deve atualizar apenas os campos informados (parcialmente)', async () => {
    const servico = makeServico({
      nome: 'Troca de Óleo',
      categoria: 'MANUTENCAO_PREVENTIVA',
      descricao: 'Óleo sintético 5w30',
      valorReferencia: 200,
    })

    await servicoRepository.create(servico)

    const result = await sut.execute({
      id: servico.getId().toValue(),
      valorReferencia: 250,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.servico.getNome()).toBe('Troca de Óleo')
      expect(result.value.servico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA')
      expect(result.value.servico.getDescricao()).toBe('Óleo sintético 5w30')
      expect(result.value.servico.getValorReferencia()).toBe(250)
    }

  })

  it('não deve editar um serviço que não existe', async () => {
    const result = await sut.execute({
      id: 'id-inexistente',
      nome: 'Serviço Qual quer',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('não deve permitir atualizar um serviço com valor de referência negativo', async () => {
    const servico = makeServico({
      valorReferencia: 100,
    })

    await servicoRepository.create(servico)

    const result = await sut.execute({
      id: servico.getId().toValue(),
      valorReferencia: -50,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ArgumentoInvalidoError)
  })
})