import { InMemoryNotificacaoRepository } from '../repositories/in-memory-notificacao-repository.js'
import { ListarNotificacoesDestinatarioUseCase } from '../../application/use-cases/listar-notificacoes-destinatario.js'
import { makeNotificacao } from '../factories/makeNotificacao.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

describe('ListarNotificacoesDestinatarioUseCase', () => {
  let inMemoryNotificacoesRepository: InMemoryNotificacaoRepository
  let sut: ListarNotificacoesDestinatarioUseCase // System Under Test

  beforeEach(() => {
    inMemoryNotificacoesRepository = new InMemoryNotificacaoRepository()
    sut = new ListarNotificacoesDestinatarioUseCase(
      inMemoryNotificacoesRepository,
    )
  })

  it('deve listar notificações não lidas do destinatário por padrão', async () => {
    const destinatarioId = new UniqueEntityID('usuario-1')

    // 1. Cria notificações para o usuário via repositório
    const notificacao1 = makeNotificacao({ destinatarioId }) // não lida
    const notificacao2 = makeNotificacao({
      destinatarioId,
      lidaEm: new Date(), // lida
    })

    await inMemoryNotificacoesRepository.create(notificacao1)
    await inMemoryNotificacoesRepository.create(notificacao2)

    // 2. Executa apenas informando o destinatarioId
    const result = await sut.execute({
      destinatarioId: 'usuario-1',
    })

    // 3. Valida se retornou apenas a não lida e com os valores default
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacoes).toHaveLength(1)
      expect(result.value.notificacoes[0].getId().toValue()).toEqual(
        notificacao1.getId().toValue(),
      )
      expect(result.value.total).toBe(1)
      expect(result.value.pagina).toBe(1)
      expect(result.value.limite).toBe(10)
    }
  })

  it('deve filtrar notificações pelo status "lidas"', async () => {
    const destinatarioId = new UniqueEntityID('usuario-1')

    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId }), // não lida
    )
    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId, lidaEm: new Date() }), // lida
    )
    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId, lidaEm: new Date() }), // lida
    )

    const result = await sut.execute({
      destinatarioId: 'usuario-1',
      status: 'lidas',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacoes).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('deve listar todas as notificações quando o status for "todos"', async () => {
    const destinatarioId = new UniqueEntityID('usuario-1')

    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId }), // não lida
    )
    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId, lidaEm: new Date() }), // lida
    )

    const result = await sut.execute({
      destinatarioId: 'usuario-1',
      status: 'todos',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacoes).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('deve paginar os resultados corretamente', async () => {
    const destinatarioId = new UniqueEntityID('usuario-1')

    for (let i = 1; i <= 5; i++) {
      const notificacao = makeNotificacao({
        destinatarioId,
        criadaEm: new Date(2026, 0, i),
      })
      await inMemoryNotificacoesRepository.create(notificacao)
    }

    // Busca a página 2 com limite de 2 itens por página
    const result = await sut.execute({
      destinatarioId: 'usuario-1',
      pagina: 2,
      limite: 2,
      status: 'nao_lidas',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacoes).toHaveLength(2)
      expect(result.value.total).toBe(5)
      expect(result.value.pagina).toBe(2)
      expect(result.value.limite).toBe(2)
    }
  })

  it('não deve retornar notificações de outros destinatários', async () => {
    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId: new UniqueEntityID('usuario-1') }),
    )
    await inMemoryNotificacoesRepository.create(
      makeNotificacao({ destinatarioId: new UniqueEntityID('usuario-2') }),
    )

    const result = await sut.execute({
      destinatarioId: 'usuario-1',
      status: 'todos',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.notificacoes).toHaveLength(1)
      expect(result.value.notificacoes[0].getDestinatarioId().toValue()).toBe(
        'usuario-1',
      )
    }
  })
})