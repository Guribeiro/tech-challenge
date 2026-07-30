import { describe, it, expect } from 'vitest'
import { OrdemServicoServico } from '../../domain/entities/ordem-servico-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

describe('Entidade: OrdemServicoServico', () => {
  const ordemServicoId = new UniqueEntityID('os-1')
  const servicoId = new UniqueEntityID('servico-1')

  const makePropsValidas = () => ({
    ordemServicoId,
    servicoId,
    nome: 'Alinhamento e Balanceamento',
    categoria: 'MANUTENCAO_PREVENTIVA' as const,
    precoUnitario: 120.0,
  })

  describe('Criação (criar)', () => {
    it('deve criar uma associação de serviço na OS válida', () => {
      const osServico = OrdemServicoServico.criar({
        ...makePropsValidas(),
        descricao: 'Alinhamento 3D e balanceamento das 4 rodas',
        observacao: 'Cliente relatou leve vibração acima de 80 km/h',
      })

      expect(osServico.getId().toValue()).toBeDefined()
      expect(osServico.getOrdemServicoId().toValue()).toBe(ordemServicoId.toValue())
      expect(osServico.getServicoId().toValue()).toBe(servicoId.toValue())
      expect(osServico.getNome()).toBe('Alinhamento e Balanceamento')
      expect(osServico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA')
      expect(osServico.getPrecoUnitario()).toBe(120.0)
      expect(osServico.getDescricao()).toBe('Alinhamento 3D e balanceamento das 4 rodas')
      expect(osServico.getObservacao()).toBe('Cliente relatou leve vibração acima de 80 km/h')
      expect(osServico.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve atribuir a data atual para criadoEm quando não for informada', () => {
      const osServico = OrdemServicoServico.criar(makePropsValidas())

      expect(osServico.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve permitir passar um UniqueEntityID personalizado no id', () => {
      const customId = new UniqueEntityID('os-servico-custom-1')

      const osServico = OrdemServicoServico.criar(makePropsValidas(), customId)

      expect(osServico.getId().toValue()).toBe('os-servico-custom-1')
    })
  })

  describe('Validações de Regra de Negócio', () => {
    it('deve lançar erro se o preço unitário for negativo', () => {
      expect(() => {
        OrdemServicoServico.criar({
          ...makePropsValidas(),
          precoUnitario: -50.0,
        })
      }).toThrow('O valor cobrado pelo serviço não pode ser negativo.')
    })

    it('deve permitir criar serviço com preço unitário igual a zero (cortesia/garantia)', () => {
      const osServico = OrdemServicoServico.criar({
        ...makePropsValidas(),
        precoUnitario: 0,
      })

      expect(osServico.getPrecoUnitario()).toBe(0)
    })
  })
})