import { describe, it, expect } from 'vitest'
import { OrdemServicoComponente } from '../../domain/entities/ordem-servico-componente.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

describe('Entidade: OrdemServicoComponente', () => {
  const ordemServicoId = new UniqueEntityID('os-1')
  const produtoId = new UniqueEntityID('produto-1')

  const makePropsValidas = () => ({
    ordemServicoId,
    produtoId,
    nome: 'Filtro de Óleo',
    tipo: 'PECA' as const,
    quantidade: 2,
    precoCusto: 2000,
    precoUnitario: 3500,
  })

  describe('Criação (criar)', () => {
    it('deve criar um componente de OS válido', () => {
      const componente = OrdemServicoComponente.criar({
        ...makePropsValidas(),
        marca: 'Bosch',
        codigoSKU: 'SKU-1234',
        codigoFabricante: 'FAB-987',
        descricao: 'Filtro para motor 1.6 16v',
        unidadeMedida: 'UN' as const,
      })

      expect(componente.getId().toValue()).toBeDefined()
      expect(componente.getOrdemServicoId().toValue()).toBe(ordemServicoId.toValue())
      expect(componente.getProdutoId().toValue()).toBe(produtoId.toValue())
      expect(componente.getNome()).toBe('Filtro de Óleo')
      expect(componente.getTipo()).toBe('PECA')
      expect(componente.getMarca()).toBe('Bosch')
      expect(componente.getCodigoSKU()).toBe('SKU-1234')
      expect(componente.getCodigoFabricante()).toBe('FAB-987')
      expect(componente.getDescricao()).toBe('Filtro para motor 1.6 16v')
      expect(componente.getQuantidade()).toBe(2)
      expect(componente.getPrecoCusto()).toBe(2000)
      expect(componente.getPrecoUnitario()).toBe(3500)
      expect(componente.getUnidadeMedida()).toBe('UN')
      expect(componente.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve atribuir a data atual para criadoEm quando não informada', () => {
      const componente = OrdemServicoComponente.criar(makePropsValidas())

      expect(componente.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve permitir passar um UniqueEntityID personalizado no id', () => {
      const customId = new UniqueEntityID('componente-custom-1')

      const componente = OrdemServicoComponente.criar(makePropsValidas(), customId)

      expect(componente.getId().toValue()).toBe('componente-custom-1')
    })
  })

  describe('Validações de Regra de Negócio', () => {
    it('deve lançar erro se a quantidade for menor ou igual a zero', () => {
      expect(() => {
        OrdemServicoComponente.criar({
          ...makePropsValidas(),
          quantidade: 0,
        })
      }).toThrow('A quantidade de um componente na OS deve ser maior que zero.')

      expect(() => {
        OrdemServicoComponente.criar({
          ...makePropsValidas(),
          quantidade: -2,
        })
      }).toThrow('A quantidade de um componente na OS deve ser maior que zero.')
    })

    it('deve lançar erro se o valor unitário for negativo', () => {
      expect(() => {
        OrdemServicoComponente.criar({
          ...makePropsValidas(),
          precoUnitario: -1000,
        })
      }).toThrow('O valor unitário do componente não pode ser negativo.')
    })

    it('deve permitir criar componente com preço unitário igual a zero', () => {
      const componente = OrdemServicoComponente.criar({
        ...makePropsValidas(),
        precoUnitario: 0,
      })

      expect(componente.getPrecoUnitario()).toBe(0)
    })
  })

  describe('Cálculos e Modificadores de Estado', () => {
    it('deve calcular o subtotal da linha corretamente (precoUnitario * quantidade)', () => {
      const componente = OrdemServicoComponente.criar({
        ...makePropsValidas(),
        quantidade: 4,
        precoUnitario: 5000,
      })

      expect(componente.getSubtotal()).toBe(20000)
    })

    it('deve permitir atualizar a quantidade e recalcular o subtotal', () => {
      const componente = OrdemServicoComponente.criar({
        ...makePropsValidas(),
        quantidade: 2,
        precoUnitario: 5000,
      })

      expect(componente.getSubtotal()).toBe(10000)

      componente.setQuantidade(5)

      expect(componente.getQuantidade()).toBe(5)
      expect(componente.getSubtotal()).toBe(25000)
    })
  })
})