import { Servico } from '../../domain/entities/servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import {
  ArgumentoInvalidoError,
  RegraDeNegocioVioladaError,
} from '@/core/errors/domain-errors/index.js'

describe('Entidade: Servico', () => {
  const makePropsValidas = () => ({
    nome: 'Troca de Óleo e Filtro',
    categoria: 'MANUTENCAO_PREVENTIVA' as const,
    descricao: 'Troca de óleo do motor e substituição do filtro de óleo.',
    valorReferencia: 150.0,
  })

  describe('Criação do Serviço (criar)', () => {
    it('deve criar um serviço com sucesso', () => {
      const props = makePropsValidas()

      const servico = Servico.criar(props)

      expect(servico.getId()).toBeInstanceOf(UniqueEntityID)
      expect(servico.getNome()).toBe('Troca de Óleo e Filtro')
      expect(servico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA')
      expect(servico.getDescricao()).toBe(
        'Troca de óleo do motor e substituição do filtro de óleo.',
      )
      expect(servico.getValorReferencia()).toBe(150.0)
      expect(servico.getCriadoEm()).toBeInstanceOf(Date)
      expect(servico.isDesativado()).toBe(false)
    })

    it('deve permitir a reconstituição informando um ID existente', () => {
      const customId = new UniqueEntityID('servico-123')

      const servico = Servico.criar(makePropsValidas(), customId)

      expect(servico.getId().toValue()).toBe('servico-123')
    })

    it('deve lançar ArgumentoInvalidoError se o nome estiver vazio ou em branco', () => {
      expect(() => {
        Servico.criar({
          ...makePropsValidas(),
          nome: '   ',
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar ArgumentoInvalidoError se a categoria não for informada', () => {
      expect(() => {
        Servico.criar({
          ...makePropsValidas(),
          categoria: undefined as any,
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar ArgumentoInvalidoError se o valorReferencia for negativo', () => {
      expect(() => {
        Servico.criar({
          ...makePropsValidas(),
          valorReferencia: -10.0,
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Atualização de Dados (atualizar)', () => {
    it('deve atualizar os dados do serviço com sucesso e atualizar o timestamp atualizadoEm', () => {
      const servico = Servico.criar(makePropsValidas())

      servico.atualizar({
        nome: 'Troca de Óleo Sintético',
        valorReferencia: 220.0,
      })

      expect(servico.getNome()).toBe('Troca de Óleo Sintético')
      expect(servico.getValorReferencia()).toBe(220.0)
      expect(servico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA') // Mantido
      expect(servico.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve validar invariantes ao atualizar os dados do serviço', () => {
      const servico = Servico.criar(makePropsValidas())

      expect(() => {
        servico.atualizar({
          valorReferencia: -50.0,
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Ciclo de Vida (Desativação e Reativação)', () => {
    it('deve desativar e reativar um serviço com sucesso', () => {
      const servico = Servico.criar(makePropsValidas())

      servico.desativar()

      expect(servico.isDesativado()).toBe(true)
      expect(servico.getDesativadoEm()).toBeInstanceOf(Date)
      expect(servico.getAtualizadoEm()).toBeInstanceOf(Date)

      servico.reativar()

      expect(servico.isDesativado()).toBe(false)
      expect(servico.getDesativadoEm()).toBeNull()
    })

    it('deve lançar RegraDeNegocioVioladaError ao tentar desativar um serviço já desativado', () => {
      const servico = Servico.criar(makePropsValidas())

      servico.desativar()

      expect(() => {
        servico.desativar()
      }).toThrow(RegraDeNegocioVioladaError)
    })
  })
})