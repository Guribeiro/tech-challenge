import { Mecanico } from '../../domain/entities/mecanico.js'
import { NomeCompleto } from '../../domain/entities/value-objects/nome-completo.js'
import { Cpf } from '../../domain/entities/value-objects/cpf.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { MecanicoCriadoEvent } from '../../domain/events/mecanico-criado-event.js'
import { makeCliente } from '../factories/make-cliente.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

describe('Entidade: Mecanico', () => {
  let cpf: Cpf
  let email: Email
  let nome: NomeCompleto

  beforeEach(() => {

    const clienteFake = makeCliente()
    cpf = clienteFake.getCpf()
    email = clienteFake.getEmail()
    nome = clienteFake.getNome()
  })

  const makePropsValidas = () => ({
    nome,
    email,
    cpf,
    especialidade: 'Injeção Eletrônica',
  })

  describe('Criação do Mecânico (criar)', () => {
    it('deve criar um mecânico com sucesso e emitir o evento MecanicoCriadoEvent', () => {
      const props = makePropsValidas()

      const mecanico = Mecanico.criar(props)

      expect(mecanico.getId()).toBeInstanceOf(UniqueEntityID)
      expect(mecanico.getNome().getValor()).toBe(nome.getValor())
      expect(mecanico.getEmail().getValor()).toBe(email.getValor())
      expect(mecanico.getCpf().getValor()).toBe(cpf.getValor())
      expect(mecanico.getEspecialidade()).toBe('Injeção Eletrônica')
      expect(mecanico.isAtivo()).toBe(true)
      expect(mecanico.getDesativadoEm()).toBeNull()
      expect(mecanico.getCriadoEm()).toBeInstanceOf(Date)

      // Valida evento de domínio
      expect(mecanico.domainEvents).toHaveLength(1)
      expect(mecanico.domainEvents[0]).toBeInstanceOf(MecanicoCriadoEvent)
      expect(
        (mecanico.domainEvents[0] as MecanicoCriadoEvent).getAggregateId()
      ).toEqual(mecanico.getId())
    })

    it('não deve emitir MecanicoCriadoEvent quando o ID for informado (reconstituição)', () => {
      const props = makePropsValidas()
      const customId = new UniqueEntityID('mecanico-123')

      const mecanico = Mecanico.criar(props, customId)

      expect(mecanico.getId().toValue()).toBe('mecanico-123')
      expect(mecanico.domainEvents).toHaveLength(0)
    })

    it('deve lançar erro se o nome do mecânico estiver em branco', () => {
      expect(() => {
        Mecanico.criar({
          ...makePropsValidas(),
          nome: NomeCompleto.criar('   '),
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Ciclo de Vida (Ativação e Desativação)', () => {
    it('deve desativar e reativar um mecânico com sucesso', () => {
      const mecanico = Mecanico.criar(makePropsValidas())

      mecanico.desativar()

      expect(mecanico.isAtivo()).toBe(false)
      expect(mecanico.getDesativadoEm()).toBeInstanceOf(Date)
      expect(mecanico.getAtualizadoEm()).toBeInstanceOf(Date)

      mecanico.reativar()

      expect(mecanico.isAtivo()).toBe(true)
      expect(mecanico.getDesativadoEm()).toBeNull()
    })

    it('deve lançar erro ao tentar desativar um mecânico já desativado', () => {
      const mecanico = Mecanico.criar(makePropsValidas())

      mecanico.desativar()

      expect(() => {
        mecanico.desativar()
      }).toThrow('Este produto já está desativado.')
    })
  })
})