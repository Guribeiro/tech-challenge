import { describe, it, expect, beforeEach } from 'vitest'
import { CriarRecepcionistaUseCase } from '@/modules/os-orcamento/application/use-cases/recepcionistas/criar-recepcionista.js'
import { Recepcionista } from '@/modules/os-orcamento/domain/entities/recepcionista.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { InMemoryRecepcionistaRepository } from '../../repositories/in-memory-recepcionista-repository.js'
import { makeRecepcionista } from '../../factories/make-recepcionista.js'


describe('UseCase: CriarRecepcionista', () => {
  let recepcionistaRepository: InMemoryRecepcionistaRepository
  let sut: CriarRecepcionistaUseCase

  beforeEach(() => {
    recepcionistaRepository = new InMemoryRecepcionistaRepository()
    sut = new CriarRecepcionistaUseCase(recepcionistaRepository)
  })

  it('deve criar e persistir um recepcionista com sucesso', async () => {
    const recepcionista = makeRecepcionista()

    const result = await sut.execute({
      nome: recepcionista.getNome().getValor(),
      cpf: recepcionista.getCpf().getValor(),
      email: recepcionista.getEmail().getValor()
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(recepcionistaRepository.recepcionistas).toContainEqual(result.value.recepcionista)
    }
  })

  it('não deve permitir criar recepcionista com e-mail já cadastrado', async () => {
    const recepcionista = makeRecepcionista()

    await recepcionistaRepository.create(recepcionista)

    const result = await sut.execute({
      nome: 'Ana Paula Silva',
      cpf: '12345678901',
      email: recepcionista.getEmail().getValor(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailJaCadastradoError)
  })

  it('não deve permitir criar recepcionista com CPF já cadastrado', async () => {
    const recepcionista = makeRecepcionista()

    await recepcionistaRepository.create(recepcionista)

    const result = await sut.execute({
      nome: 'Ana Paula Silva',
      cpf: recepcionista.getCpf().getValor(),
      email: 'ana.paula@oficina.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CpfJaCadastradoError)
  })
})