import { OrcamentoComponente } from '../../domain/entities/orcamento-componente.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

describe('Entidade: OrcamentoComponente', () => {
  const orcamentoId = new UniqueEntityID('orcamento-1')
  const produtoId = new UniqueEntityID('produto-1')

  const makePropsValidas = () => ({
    orcamentoId,
    produtoId,
    nome: 'Pastilha de Freio Dianteira',
    tipo: 'PECA' as const,
    quantidade: 2,
    precoCusto: 5000, // R$ 50,00 em centavos
    precoUnitario: 8500, // R$ 85,00 em centavos
  })

  describe('Criação (criar)', () => {
    it('deve criar um componente de orçamento válido com valores em centavos', () => {
      const componente = OrcamentoComponente.criar({
        ...makePropsValidas(),
        marca: 'Fras-le',
        codigoSKU: 'SKU-9988',
        codigoFabricante: 'FAB-554',
        descricao: 'Jogo de pastilhas de freio para sistema de disco ventilado',
        unidadeMedida: 'JOGO' as const,
      })

      expect(componente.getId().toValue()).toBeDefined()
      expect(componente.getOrcamentoId().toValue()).toBe(orcamentoId.toValue())
      expect(componente.getProdutoId().toValue()).toBe(produtoId.toValue())
      expect(componente.getNome()).toBe('Pastilha de Freio Dianteira')
      expect(componente.getTipo()).toBe('PECA')
      expect(componente.getMarca()).toBe('Fras-le')
      expect(componente.getCodigoSKU()).toBe('SKU-9988')
      expect(componente.getCodigoFabricante()).toBe('FAB-554')
      expect(componente.getDescricao()).toBe('Jogo de pastilhas de freio para sistema de disco ventilado')
      expect(componente.getQuantidade()).toBe(2)
      expect(componente.getPrecoCusto()).toBe(5000)
      expect(componente.getPrecoUnitario()).toBe(8500)
      expect(componente.getUnidadeMedida()).toBe('JOGO')
      expect(componente.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve atribuir a data atual para criadoEm quando não for informada', () => {
      const componente = OrcamentoComponente.criar(makePropsValidas())

      expect(componente.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve permitir passar um UniqueEntityID personalizado no id', () => {
      const customId = new UniqueEntityID('componente-custom-1')

      const componente = OrcamentoComponente.criar(makePropsValidas(), customId)

      expect(componente.getId().toValue()).toBe('componente-custom-1')
    })
  })

  describe('Validações de Regra de Negócio', () => {
    it('deve lançar erro se a quantidade for menor ou igual a zero', () => {
      expect(() => {
        OrcamentoComponente.criar({
          ...makePropsValidas(),
          quantidade: 0,
        })
      }).toThrow('A quantidade de um componente na OS deve ser maior que zero.')

      expect(() => {
        OrcamentoComponente.criar({
          ...makePropsValidas(),
          quantidade: -1,
        })
      }).toThrow('A quantidade de um componente na OS deve ser maior que zero.')
    })

    it('deve lançar erro se o valor unitário for negativo', () => {
      expect(() => {
        OrcamentoComponente.criar({
          ...makePropsValidas(),
          precoUnitario: -1000,
        })
      }).toThrow('O valor unitário do componente não pode ser negativo.')
    })

    it('deve permitir criar componente com preço unitário zerado (ex: item promocional/cortesia)', () => {
      const componente = OrcamentoComponente.criar({
        ...makePropsValidas(),
        precoUnitario: 0,
      })

      expect(componente.getPrecoUnitario()).toBe(0)
    })
  })

  describe('Cálculos e Modificadores de Estado', () => {
    it('deve calcular o subtotal da linha em centavos (precoUnitario * quantidade)', () => {
      const componente = OrcamentoComponente.criar({
        ...makePropsValidas(),
        quantidade: 3,
        precoUnitario: 12000, // R$ 120,00 em centavos
      })

      // 12000 * 3 = 36000 centavos (R$ 360,00)
      expect(componente.getSubtotal()).toBe(36000)
    })

    it('deve permitir atualizar a quantidade e recalcular o subtotal em centavos', () => {
      const componente = OrcamentoComponente.criar({
        ...makePropsValidas(),
        quantidade: 2,
        precoUnitario: 4500, // R$ 45,00 em centavos -> Subtotal inicial: 9000
      })

      expect(componente.getSubtotal()).toBe(9000)

      componente.setQuantidade(4)

      expect(componente.getQuantidade()).toBe(4)
      expect(componente.getSubtotal()).toBe(18000) // 4500 * 4 = 18000 centavos
    })
  })
})