import { Recepcionista } from '../../domain/entities/recepcionista.js'
import { NomeCompleto } from '../../domain/entities/value-objects/nome-completo.js'
import { Cpf } from '../../domain/entities/value-objects/cpf.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { makeRecepcionista } from '../factories/make-recepcionista.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

describe('Entidade: Recepcionista', () => {
  let cpf: Cpf
  let email: Email
  let nome: NomeCompleto

  beforeEach(() => {

    const recepcionistaFake = makeRecepcionista()
    cpf = recepcionistaFake.getCpf()
    email = recepcionistaFake.getEmail()
    nome = recepcionistaFake.getNome()
  })

  const makePropsValidas = () => ({
    nome,
    cpf,
    email,
  })

  describe('Criação (criar)', () => {
    it('deve criar um recepcionista válido e disparar evento de domínio quando for um novo registro', () => {
      const recepcionista = Recepcionista.criar(makePropsValidas())

      expect(recepcionista.getId().toValue()).toBeDefined()
      expect(recepcionista.getNome().getValor()).toBe(nome.getValor())
      expect(recepcionista.getEmail().getValor()).toBe(email.getValor())
      expect(recepcionista.getCpf().getValor()).toBe(cpf.getValor())
      expect(recepcionista.isAtivo()).toBe(true)
      expect(recepcionista.getDesativadoEm()).toBeNull()
      expect(recepcionista.domainEvents).toHaveLength(1)
    })

    it('não deve disparar evento de domínio quando fornecido um id existente (restauração)', () => {
      const idExistente = new UniqueEntityID('recepcionista-123')
      const recepcionista = Recepcionista.criar(makePropsValidas(), idExistente)

      expect(recepcionista.getId().toValue()).toBe('recepcionista-123')
      expect(recepcionista.domainEvents).toHaveLength(0)
    })
  })

  describe('Validações', () => {
    it('deve lançar erro se o nome estiver ausente ou em branco', () => {
      expect(() => {
        Recepcionista.criar({
          ...makePropsValidas(),
          nome: NomeCompleto.criar(''),
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Gestão do Ciclo de Vida', () => {
    it('deve desativar o recepcionista com sucesso', () => {
      const recepcionista = Recepcionista.criar(makePropsValidas())

      recepcionista.desativar()

      expect(recepcionista.isAtivo()).toBe(false)
      expect(recepcionista.getDesativadoEm()).toBeInstanceOf(Date)
      expect(recepcionista.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve lançar erro ao tentar desativar um recepcionista já desativado', () => {
      const recepcionista = Recepcionista.criar(makePropsValidas())
      recepcionista.desativar()

      expect(() => recepcionista.desativar()).toThrow('Este recepcionista já está desativado.')
    })

    it('deve reativar um recepcionista desativado', () => {
      const recepcionista = Recepcionista.criar(makePropsValidas())
      recepcionista.desativar()

      recepcionista.reativar()

      expect(recepcionista.isAtivo()).toBe(true)
      expect(recepcionista.getDesativadoEm()).toBeNull()
    })
  })
})