import { OrcamentoServico } from '../../domain/entities/orcamento-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

describe('Entidade: OrcamentoServico', () => {
  const orcamentoId = new UniqueEntityID('orcamento-1')
  const servicoId = new UniqueEntityID('servico-1')

  const makePropsValidas = () => ({
    orcamentoId,
    servicoId,
    nome: 'Alinhamento e Balanceamento',
    categoria: 'MANUTENCAO_PREVENTIVA' as const,
    precoUnitario: 15000, // R$ 150,00 em centavos
  })

  describe('Criação (criar)', () => {
    it('deve criar um serviço de orçamento válido com preço em centavos', () => {
      const servico = OrcamentoServico.criar({
        ...makePropsValidas(),
        descricao: 'Alinhamento 3D e balanceamento das 4 rodas',
        observacao: 'Veículo apresentava leve vibração no volante acima de 80 km/h',
      })

      expect(servico.getId().toValue()).toBeDefined()
      expect(servico.getOrcamentoId().toValue()).toBe(orcamentoId.toValue())
      expect(servico.getServicoId().toValue()).toBe(servicoId.toValue())
      expect(servico.getNome()).toBe('Alinhamento e Balanceamento')
      expect(servico.getCategoria()).toBe('MANUTENCAO_PREVENTIVA')
      expect(servico.getPrecoUnitario()).toBe(15000)
      expect(servico.getDescricao()).toBe('Alinhamento 3D e balanceamento das 4 rodas')
      expect(servico.getObservacao()).toBe('Veículo apresentava leve vibração no volante acima de 80 km/h')
      expect(servico.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve atribuir a data atual para criadoEm quando não for informada', () => {
      const servico = OrcamentoServico.criar(makePropsValidas())

      expect(servico.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve permitir passar um UniqueEntityID personalizado no id', () => {
      const customId = new UniqueEntityID('orcamento-servico-custom-1')

      const servico = OrcamentoServico.criar(makePropsValidas(), customId)

      expect(servico.getId().toValue()).toBe('orcamento-servico-custom-1')
    })
  })

  describe('Validações de Regra de Negócio', () => {
    it('deve lançar erro se o preço unitário for negativo', () => {
      expect(() => {
        OrcamentoServico.criar({
          ...makePropsValidas(),
          precoUnitario: -5000, // -R$ 50,00 em centavos
        })
      }).toThrow('O valor cobrado pelo serviço não pode ser negativo.')
    })

    it('deve permitir criar um serviço com preço unitário zerado (ex: cortesia ou revisão gratuita)', () => {
      const servico = OrcamentoServico.criar({
        ...makePropsValidas(),
        precoUnitario: 0,
      })

      expect(servico.getPrecoUnitario()).toBe(0)
    })
  })
})