import { Fatura } from '../../domain/entities/fatura.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'

describe('Entidade: Fatura', () => {
  const orcamentoId = new UniqueEntityID('orcamento-123')

  describe('Criação da Fatura', () => {
    it('deve criar uma nova fatura pendente e disparar o evento FaturaEmitidaEvent', () => {
      const fatura = Fatura.criar({
        orcamentoId,
        valorTotal: 350.0,
      })

      expect(fatura.getId()).toBeInstanceOf(UniqueEntityID)
      expect(fatura.getOrcamentoId()).toEqual(orcamentoId)
      expect(fatura.getValorTotal()).toBe(350.0)
      expect(fatura.getStatus()).toBe('PENDENTE')
      expect(fatura.estaPaga()).toBe(false)
      expect(fatura.getEmitidaEm()).toBeInstanceOf(Date)
      expect(fatura.getPagaEm()).toBeNull()

      // Valida evento de domínio de emissão
      expect(fatura.domainEvents).toHaveLength(1)
      expect(fatura.domainEvents[0]).toBeInstanceOf(FaturaEmitidaEvent)
      expect(
        (fatura.domainEvents[0] as FaturaEmitidaEvent).getAggregateId()
      ).toEqual(fatura.getId())
    })

    it('não deve disparar FaturaEmitidaEvent se o ID já for informado (reconstituição do banco)', () => {
      const faturaId = new UniqueEntityID('fatura-existente-123')

      const fatura = Fatura.criar(
        {
          orcamentoId,
          valorTotal: 500.0,
          status: 'PENDENTE',
        },
        faturaId
      )

      expect(fatura.getId().toValue()).toBe('fatura-existente-123')
      expect(fatura.domainEvents).toHaveLength(0)
    })
  })

  describe('Fluxo de Pagamento', () => {
    it('deve pagar uma fatura pendente com sucesso e registrar o evento FaturaPagaEvent', () => {
      const fatura = Fatura.criar({
        orcamentoId,
        valorTotal: 200.0,
      })

      // Limpa os eventos de emissão para isolar o evento de pagamento
      fatura.clearEvents()

      fatura.pagar()

      expect(fatura.getStatus()).toBe('PAGA')
      expect(fatura.estaPaga()).toBe(true)
      expect(fatura.getPagaEm()).toBeInstanceOf(Date)

      // Valida o evento de domínio de pagamento
      expect(fatura.domainEvents).toHaveLength(1)
      expect(fatura.domainEvents[0]).toBeInstanceOf(FaturaPagaEvent)
      expect(
        (fatura.domainEvents[0] as FaturaPagaEvent).getAggregateId()
      ).toEqual(fatura.getId())
    })

    it('deve lançar um erro ao tentar pagar uma fatura que já está paga', () => {
      const fatura = Fatura.criar({
        orcamentoId,
        valorTotal: 150.0,
      })

      fatura.pagar()

      expect(() => {
        fatura.pagar()
      }).toThrow('Não é possível pagar uma fatura com status: PAGA')
    })

    it('deve lançar um erro ao tentar pagar uma fatura cancelada', () => {
      const fatura = Fatura.criar({
        orcamentoId,
        valorTotal: 100.0,
        status: 'CANCELADA',
      })

      expect(() => {
        fatura.pagar()
      }).toThrow('Não é possível pagar uma fatura com status: CANCELADA')
    })
  })
})