import { Veiculo } from '../../domain/entities/veiculo.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'
import {
  ArgumentoInvalidoError,
  RegraDeNegocioVioladaError,
} from '@/core/errors/domain-errors/index.js'

describe('Entidade: Veiculo', () => {
  const clienteId = new UniqueEntityID('cliente-123')

  const makePropsValidas = () => ({
    clienteId,
    placa: Placa.criar('ABC1D23'), // Padrão Mercosul ou antigo válido
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2022,
    cor: 'Preto',
    quilometragem: 45000,
    combustivel: 'Flex',
    observacoes: 'Revisões em dia.',
  })

  describe('Criação do Veículo (criar)', () => {
    it('deve criar um veículo com sucesso', () => {
      const props = makePropsValidas()

      const veiculo = Veiculo.criar(props)

      expect(veiculo.getId()).toBeInstanceOf(UniqueEntityID)
      expect(veiculo.getClienteId()).toEqual(clienteId)
      expect(veiculo.getPlaca().getValor()).toBe('ABC1D23')
      expect(veiculo.getMarca()).toBe('Toyota')
      expect(veiculo.getModelo()).toBe('Corolla')
      expect(veiculo.getAno()).toBe(2022)
      expect(veiculo.getCor()).toBe('Preto')
      expect(veiculo.getQuilometragem()).toBe(45000)
      expect(veiculo.getCombustivel()).toBe('Flex')
      expect(veiculo.getObservacoes()).toBe('Revisões em dia.')
      expect(veiculo.getCriadoEm()).toBeInstanceOf(Date)
      expect(veiculo.isDeletado()).toBe(false)
      expect(veiculo.getDeletadoEm()).toBeNull()
    })

    it('deve permitir a reconstituição informando um ID existente', () => {
      const customId = new UniqueEntityID('veiculo-existente-123')

      const veiculo = Veiculo.criar(makePropsValidas(), customId)

      expect(veiculo.getId().toValue()).toBe('veiculo-existente-123')
    })

    it('deve lançar ArgumentoInvalidoError se marca ou modelo estiverem vazios', () => {
      expect(() => {
        Veiculo.criar({
          ...makePropsValidas(),
          marca: '  ',
        })
      }).toThrow(ArgumentoInvalidoError)

      expect(() => {
        Veiculo.criar({
          ...makePropsValidas(),
          modelo: '',
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar ArgumentoInvalidoError se o ano for menor que 1900 ou superior ao próximo ano', () => {
      const anoAtual = new Date().getFullYear()

      // Ano no passado muito distante
      expect(() => {
        Veiculo.criar({
          ...makePropsValidas(),
          ano: 1899,
        })
      }).toThrow(ArgumentoInvalidoError)

      // Ano muito no futuro (além do próximo ano)
      expect(() => {
        Veiculo.criar({
          ...makePropsValidas(),
          ano: anoAtual + 2,
        })
      }).toThrow(ArgumentoInvalidoError)
    })

    it('deve lançar ArgumentoInvalidoError se a quilometragem for negativa', () => {
      expect(() => {
        Veiculo.criar({
          ...makePropsValidas(),
          quilometragem: -100,
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Atualização de Dados (atualizar)', () => {
    it('deve atualizar os dados do veículo com sucesso e marcar atualizadoEm', () => {
      const veiculo = Veiculo.criar(makePropsValidas())

      const novaPlaca = Placa.criar('XYZ9876')

      veiculo.atualizar({
        placa: novaPlaca,
        quilometragem: 50000,
        cor: 'Branco',
      })

      expect(veiculo.getPlaca().getValor()).toBe('XYZ9876')
      expect(veiculo.getQuilometragem()).toBe(50000)
      expect(veiculo.getCor()).toBe('Branco')
      expect(veiculo.getMarca()).toBe('Toyota') // Mantido
      expect(veiculo.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve validar invariantes ao atualizar dados do veículo', () => {
      const veiculo = Veiculo.criar(makePropsValidas())

      expect(() => {
        veiculo.atualizar({
          quilometragem: -50,
        })
      }).toThrow(ArgumentoInvalidoError)
    })
  })

  describe('Exclusão (deletar)', () => {
    it('deve realizar a exclusão lógica do veículo', () => {
      const veiculo = Veiculo.criar(makePropsValidas())

      veiculo.deletar()

      expect(veiculo.isDeletado()).toBe(true)
      expect(veiculo.getDeletadoEm()).toBeInstanceOf(Date)
      expect(veiculo.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve lançar RegraDeNegocioVioladaError ao tentar deletar um veículo já excluído', () => {
      const veiculo = Veiculo.criar(makePropsValidas())

      veiculo.deletar()

      expect(() => {
        veiculo.deletar()
      }).toThrow(RegraDeNegocioVioladaError)
    })
  })
})