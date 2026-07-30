import { Produto } from '../../domain/entities/produto.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

import {
  ArgumentoInvalidoError,
  RegraDeNegocioVioladaError,
} from '@/core/errors/domain-errors/index.js'
import { PrecoInvalidoError } from '../../domain/errors/preco-invalido-error.js'
import { SaldoInsuficienteError } from '../../domain/errors/saldo-insuficiente-error.js'

describe('Entidade: Produto', () => {
  const produtoValidoBase = {
    nome: 'Filtro de Óleo',
    tipo: 'PECA' as const,
    precoCusto: 30.0,
    precoUnitario: 50.0,
    quantidadeEstoque: 10,
    quantidadeReservada: 0,
  }

  describe('Criação e Validações Iniciais (criar)', () => {
    it('deve criar um produto com sucesso mantendo os valores padrão', () => {
      const produto = Produto.criar({
        nome: 'Óleo 5W30',
        tipo: 'INSUMO',
        precoCusto: 20,
        precoUnitario: 40,
      })

      expect(produto.getId()).toBeInstanceOf(UniqueEntityID)
      expect(produto.getNome()).toBe('Óleo 5W30')
      expect(produto.getQuantidadeEstoque()).toBe(0)
      expect(produto.getQuantidadeReservada()).toBe(0)
      expect(produto.isAtivo()).toBe(true)
      expect(produto.getCriadoEm()).toBeInstanceOf(Date)
      expect(produto.getQuantidadeDisponivel()).toBe(0)
    })

    it('deve lançar ArgumentoInvalidoError se o nome for vazio ou contiver apenas espaços', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          nome: '   ',
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar PrecoInvalidoError para preços de custo ou venda negativos', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          precoCusto: -10,
        })
      }).toThrow(PrecoInvalidoError)

      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          precoUnitario: -5,
        })
      }).toThrow(PrecoInvalidoError)
    })

    it('deve lançar PrecoInvalidoError se o preço de venda for menor que o preço de custo', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          precoCusto: 100.0,
          precoUnitario: 80.0,
        })
      }).toThrow(PrecoInvalidoError)
    })

    it('deve lançar ArgumentoInvalidoError se o estoque ou reserva iniciais forem negativos', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          quantidadeEstoque: -1,
        })
      }).toThrow(ArgumentoInvalidoError)

      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          quantidadeReservada: -1,
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar RegraDeNegocioVioladaError se a quantidade reservada for maior que o estoque inicial', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          quantidadeEstoque: 5,
          quantidadeReservada: 10,
        })
      }).toThrow(RegraDeNegocioVioladaError)
    })

    it('deve validar limites de estoque mínimo e máximo', () => {
      expect(() => {
        Produto.criar({
          ...produtoValidoBase,
          estoqueMinimo: 10,
          estoqueMaximo: 5,
        })
      }).toThrow(RegraDeNegocioVioladaError)
    })
  })

  describe('Gestão de Reservas', () => {
    it('deve reservar estoque com sucesso', () => {
      const produto = Produto.criar(produtoValidoBase)

      produto.reservar(3)

      expect(produto.getQuantidadeReservada()).toBe(3)
      expect(produto.getQuantidadeDisponivel()).toBe(7)
      expect(produto.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve lançar ArgumentoInvalidoError ao tentar reservar quantidade menor ou igual a zero', () => {
      const produto = Produto.criar(produtoValidoBase)

      expect(() => produto.reservar(0)).toThrow(ArgumentoInvalidoError)
      expect(() => produto.reservar(-2)).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar SaldoInsuficienteError ao tentar reservar mais do que o disponível', () => {
      const produto = Produto.criar(produtoValidoBase) // 10 em estoque

      expect(() => produto.reservar(15)).toThrow(SaldoInsuficienteError)
    })

    it('deve confirmar reserva e deduzir tanto do estoque quanto da reserva', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 10,
        quantidadeReservada: 4,
      })

      produto.confirmarReservaEDeduzir(3)

      expect(produto.getQuantidadeReservada()).toBe(1)
      expect(produto.getQuantidadeEstoque()).toBe(7)
      expect(produto.getQuantidadeDisponivel()).toBe(6)
    })

    it('deve lançar ArgumentoInvalidoError ao tentar confirmar baixa superior às reservas existentes', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 10,
        quantidadeReservada: 2,
      })

      expect(() => produto.confirmarReservaEDeduzir(3)).toThrow(
        ArgumentoInvalidoError
      )
    })

    it('deve cancelar reserva devolvendo o saldo para disponível', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 10,
        quantidadeReservada: 4,
      })

      produto.cancelarReserva(2)

      expect(produto.getQuantidadeReservada()).toBe(2)
      expect(produto.getQuantidadeDisponivel()).toBe(8)
    })

    it('deve lançar ArgumentoInvalidoError ao tentar cancelar mais reservas do que o produto possui', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 10,
        quantidadeReservada: 2,
      })

      expect(() => produto.cancelarReserva(5)).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Entrada e Alteração de Estoque e Preços', () => {
    it('deve adicionar estoque respeitando o estoque máximo', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 10,
        estoqueMaximo: 20,
      })

      produto.adicionarEstoque(5)

      expect(produto.getQuantidadeEstoque()).toBe(15)
    })

    it('deve lançar ArgumentoInvalidoError ao tentar exceder o estoque máximo', () => {
      const produto = Produto.criar({
        ...produtoValidoBase,
        quantidadeEstoque: 15,
        estoqueMaximo: 20,
      })

      expect(() => produto.adicionarEstoque(10)).toThrow(
        ArgumentoInvalidoError
      )
    })

    it('deve atualizar o preço unitário com valor válido', () => {
      const produto = Produto.criar(produtoValidoBase)

      produto.atualizarPreco(65.0)

      expect(produto.getPrecoUnitario()).toBe(65.0)
    })

    it('deve lançar PrecoInvalidoError ao tentar atualizar preço para um valor negativo', () => {
      const produto = Produto.criar(produtoValidoBase)

      expect(() => produto.atualizarPreco(-1)).toThrow(PrecoInvalidoError)
    })
  })

  describe('Ciclo de Vida (Ativação e Desativação)', () => {
    it('deve desativar e reativar um produto corretamente', () => {
      const produto = Produto.criar(produtoValidoBase)

      produto.desativar()

      expect(produto.isAtivo()).toBe(false)
      expect(produto.getDesativadoEm()).toBeInstanceOf(Date)

      produto.reativar()

      expect(produto.isAtivo()).toBe(true)
      expect(produto.getDesativadoEm()).toBeNull()
    })

    it('deve lançar RegraDeNegocioVioladaError ao desativar um produto já desativado', () => {
      const produto = Produto.criar(produtoValidoBase)

      produto.desativar()

      expect(() => produto.desativar()).toThrow(RegraDeNegocioVioladaError)
    })
  })
})