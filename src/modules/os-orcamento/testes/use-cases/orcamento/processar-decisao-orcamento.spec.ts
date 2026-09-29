import { InMemoryTokenRepository } from '../../repositories/in-memory-token-repository.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { ProcessarDecisaoOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/processar-decisao-orcamento.js'
import { Token } from '@/modules/os-orcamento/domain/entities/token.js'
import { TokenType } from '@/modules/os-orcamento/domain/entities/value-objects/token-type.js'
import { makeOrcamento } from '../../factories/make-orcamento.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'

let tokenRepository: InMemoryTokenRepository
let orcamentoRepository: InMemoryOrcamentoRepository
let sut: ProcessarDecisaoOrcamentoUseCase

describe('Processar Decisão de Orçamento (Aprovação / Reprovação)', () => {
  beforeEach(() => {
    tokenRepository = new InMemoryTokenRepository()
    orcamentoRepository = new InMemoryOrcamentoRepository()
    sut = new ProcessarDecisaoOrcamentoUseCase(tokenRepository, orcamentoRepository)
  })

  it('deve ser capaz de aprovar um orçamento utilizando um token válido', async () => {
    const orcamento = makeOrcamento({ status: 'ENVIADO' })
    await orcamentoRepository.create(orcamento)

    const token = Token.create({
      orcamentoId: orcamento.getId().toValue(),
      tipo: TokenType.APROVACAO_ORCAMENTO,
    })
    await tokenRepository.create(token)

    const result = await sut.execute({
      token: token.getToken(),
      decisao: 'APROVADO',
    })

    expect(result.isRight()).toBe(true)
    expect(orcamentoRepository.items[0].getStatus()).toBe('APROVADO')
    expect(tokenRepository.items[0].getUsado()).toBe(true)
  })

  it('deve ser capaz de reprovar um orçamento utilizando um token válido', async () => {
    const orcamento = makeOrcamento({ status: 'ENVIADO' })
    await orcamentoRepository.create(orcamento)

    const token = Token.create({
      orcamentoId: orcamento.getId().toValue(),
      tipo: TokenType.APROVACAO_ORCAMENTO,
    })
    await tokenRepository.create(token)

    const result = await sut.execute({
      token: token.getToken(),
      decisao: 'RECUSADO',
      motivoRecusa: 'Valor muito alto',
    })

    expect(result.isRight()).toBe(true)
    expect(orcamentoRepository.items[0].getStatus()).toBe('RECUSADO')
    expect(tokenRepository.items[0].getUsado()).toBe(true)
  })

  it('não deve permitir processar decisão com um token inexistente', async () => {
    const result = await sut.execute({
      token: 'token-invalido',
      decisao: 'APROVADO',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('não deve permitir processar decisão com um token já utilizado', async () => {
    const orcamento = makeOrcamento({ status: 'ENVIADO' })
    await orcamentoRepository.create(orcamento)

    const token = Token.create({
      orcamentoId: orcamento.getId().toValue(),
      tipo: TokenType.APROVACAO_ORCAMENTO,
      usado: true,
    })
    await tokenRepository.create(token)

    const result = await sut.execute({
      token: token.getToken(),
      decisao: 'APROVADO',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('não deve permitir decidir um orçamento que não foi enviado ou renegociado', async () => {
    const orcamento = makeOrcamento({ status: 'RECUSADO' })
    await orcamentoRepository.create(orcamento)

    const token = Token.create({
      orcamentoId: orcamento.getId().toValue(),
      tipo: TokenType.APROVACAO_ORCAMENTO,
    })
    await tokenRepository.create(token)

    const result = await sut.execute({
      token: token.getToken(),
      decisao: 'APROVADO',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
    expect(orcamentoRepository.items[0].getStatus()).toBe('RECUSADO')
    expect(tokenRepository.items[0].getUsado()).toBe(false)
  })
})