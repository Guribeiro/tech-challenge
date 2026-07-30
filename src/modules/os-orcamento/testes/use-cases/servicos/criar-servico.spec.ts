import { describe, beforeEach, it, expect } from 'vitest'
import { CriarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/criar-servico.js'
import { InMemoryServicoRepository } from "../../repositories/in-memory-servico-repository.js";
import { makeServico } from '../../factories/make-servico.js';
import { ServicoJaCadastradoError } from '@/core/errors/index.js'

describe('CriarServicoUseCase', () => {
  let servicosRepository: InMemoryServicoRepository
  let sut: CriarServicoUseCase

  beforeEach(() => {
    servicosRepository = new InMemoryServicoRepository()
    sut = new CriarServicoUseCase(servicosRepository)
  })

  it('deve criar um serviço com sucesso', async () => {


    const result = await sut.execute({
      nome: ' Troca de Óleo ',
      descricao: 'Troca de óleo do motor e filtro',
      categoria: 'ESTETICA',
      valorReferencia: 1500,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.servico).toBeDefined()
      expect(result.value.servico.getNome()).toBe(' Troca de Óleo ')
      expect(result.value.servico.getValorReferencia()).toBe(1500)

      expect(servicosRepository.servicos).toHaveLength(1)
      expect(servicosRepository.servicos[0].getId()).toEqual(
        result.value.servico.getId()
      )
    }
  })

  it('deve retornar ServicoJaCadastradoError ao tentar cadastrar serviço com nome duplicado (considerando trim)', async () => {
    const nomeServico = 'Troca de Óleo'

    // Cadastra serviço prévio no repositório em memória
    const servicoExistente = makeServico({ nome: nomeServico })
    await servicosRepository.create(servicoExistente)

    // Tenta criar um serviço com o mesmo nome contendo espaços nas extremidades
    const result = await sut.execute({
      nome: `  ${nomeServico}  `,
      categoria: 'ESTETICA',
      valorReferencia: 180.0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ServicoJaCadastradoError)
    expect(servicosRepository.servicos).toHaveLength(1)
  })
})