import { InMemoryTokenRepository } from '@/modules/os-orcamento/testes/repositories/in-memory-token-repository.js'
import { GerarTokenAprovacaoOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/gerar-token-aprovacao-orcamento.js'

let tokenRepository: InMemoryTokenRepository
let sut: GerarTokenAprovacaoOrcamentoUseCase

describe('Gerar Token de Aprovação de Orçamento', () => {
  beforeEach(() => {
    tokenRepository = new InMemoryTokenRepository()
    sut = new GerarTokenAprovacaoOrcamentoUseCase(tokenRepository)
  })

  it('deve ser capaz de gerar um novo token de aprovação para um orçamento', async () => {
    const result = await sut.execute({
      orcamentoId: 'orcamento-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { token } = result.value
      expect(tokenRepository.items[0]).toEqual(
        expect.objectContaining(token),
      )
    }
  })

  it('deve persistir o token gerado corretamente no repositório', async () => {
    await sut.execute({
      orcamentoId: 'orcamento-2',
    })

    expect(tokenRepository.items).toHaveLength(1)
    expect(tokenRepository.items[0].getToken()).toEqual(expect.any(String))
    expect(tokenRepository.items[0].getToken().length).toBeGreaterThan(0)
  })

  it('deve definir uma data de expiração padrão superior ao momento atual', async () => {
    const result = await sut.execute({
      orcamentoId: 'orcamento-3',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      const { token } = result.value
      expect(token.getExpiraEm().getTime()).toBeGreaterThan(Date.now())
      expect(token.estaExpirado()).toBe(false)
    }
  })

  it('deve ser capaz de gerar múltiplos tokens para o mesmo orçamento se necessário', async () => {
    await sut.execute({ orcamentoId: 'orcamento-4' })
    await sut.execute({ orcamentoId: 'orcamento-4' })

    expect(tokenRepository.items).toHaveLength(2)
    expect(tokenRepository.items[0].getOrcamentoId()).toBe('orcamento-4')
    expect(tokenRepository.items[1].getOrcamentoId()).toBe('orcamento-4')
    expect(tokenRepository.items[0].getToken()).not.toEqual(tokenRepository.items[1].getToken())
  })
})