import { describe, beforeEach, it, expect } from 'vitest'
import { InMemoryNotificacaoRepository } from '../repositories/in-memory-notificacao-repository.js'
import { MarcarNotificacaoComoLidaUseCase } from '../../application/use-cases/marcar-notificacao-como-lida.js'
import { makeNotificacao } from '../factories/makeNotificacao.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'

describe('MarcarNotificacaoComoLidaUseCase', () => {
  let inMemoryNotificacoesRepository: InMemoryNotificacaoRepository
  let sut: MarcarNotificacaoComoLidaUseCase

  beforeEach(() => {
    inMemoryNotificacoesRepository = new InMemoryNotificacaoRepository()
    sut = new MarcarNotificacaoComoLidaUseCase(inMemoryNotificacoesRepository)
  })

  it('deve marcar uma notificação como lida', async () => {
    const notificacao = makeNotificacao({
      destinatarioId: new UniqueEntityID('usuario-1'),
    })

    await inMemoryNotificacoesRepository.create(notificacao)

    const result = await sut.execute({
      notificacaoId: notificacao.getId().toValue(),
      destinatarioId: 'usuario-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacao.getLidaEm()).toEqual(expect.any(Date))
      expect(inMemoryNotificacoesRepository.notificacoes[0].getLidaEm()).toEqual(
        expect.any(Date),
      )
    }
  })

  it('não deve marcar como lida uma notificação inexistente', async () => {
    const result = await sut.execute({
      notificacaoId: 'notificacao-inexistente',
      destinatarioId: 'usuario-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecursoNaoEncontradoError)
  })

  it('não deve permitir que um destinatário marque a notificação de outro usuário como lida', async () => {
    const notificacao = makeNotificacao({
      destinatarioId: new UniqueEntityID('usuario-1'),
    })

    await inMemoryNotificacoesRepository.create(notificacao)

    const result = await sut.execute({
      notificacaoId: notificacao.getId().toValue(),
      destinatarioId: 'usuario-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AcessoNegadoError)
  })
})