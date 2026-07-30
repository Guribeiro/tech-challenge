import { describe, it, expect } from 'vitest'
import { TermoLiberacao } from '../../domain/entities/termo-liberacao.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { TermoLiberacaoEmitidoEvent } from '../../domain/events/termo-liberacao-emitido-event.js'
import { TermoLiberacaoPorRejeicaoEmitidoEvent } from '../../domain/events/termo-liberacao-por-rejeicao-emitido-event.js'

describe('Entidade: TermoLiberacao', () => {
  const ordemServicoId = new UniqueEntityID('os-123')
  const placaVeiculo = 'ABC-1234'

  describe('Criação com Motivo: PAGAMENTO_APROVADO', () => {
    it('deve criar um termo de liberação por pagamento aprovado e emitir TermoLiberacaoEmitidoEvent', () => {
      const termo = TermoLiberacao.criar({
        ordemServicoId,
        placaVeiculo,
        motivo: 'PAGAMENTO_APROVADO',
      })

      expect(termo.getId()).toBeInstanceOf(UniqueEntityID)
      expect(termo.getOrdemServicoId()).toEqual(ordemServicoId)
      expect(termo.getPlacaVeiculo()).toBe(placaVeiculo)
      expect(termo.getMotivo()).toBe('PAGAMENTO_APROVADO')
      expect(termo.getEmitidoEm()).toBeInstanceOf(Date)

      // Valida o conteúdo textual gerado
      expect(termo.getConteudo()).toContain('TERMO DE LIBERAÇÃO DE VEÍCULO')
      expect(termo.getConteudo()).toContain(`OS #${ordemServicoId.toValue()}`)
      expect(termo.getConteudo()).toContain(`Veículo Placa: ${placaVeiculo}`)
      expect(termo.getConteudo()).toContain('Motivo da Liberação: Pagamento Confirmado')

      // Valida o disparo do evento correspondente
      expect(termo.domainEvents).toHaveLength(1)
      expect(termo.domainEvents[0]).toBeInstanceOf(TermoLiberacaoEmitidoEvent)
      expect(
        (termo.domainEvents[0] as TermoLiberacaoEmitidoEvent).getAggregateId()
      ).toEqual(termo.getId())
    })
  })

  describe('Criação com Motivo: REJEICAO_ORCAMENTO', () => {
    it('deve criar um termo por rejeição e emitir TermoLiberacaoPorRejeicaoEmitidoEvent', () => {
      const termo = TermoLiberacao.criar({
        ordemServicoId,
        placaVeiculo,
        motivo: 'REJEICAO_ORCAMENTO',
      })

      expect(termo.getMotivo()).toBe('REJEICAO_ORCAMENTO')
      expect(termo.getConteudo()).toContain('Motivo da Liberação: Orçamento Rejeitado')

      // Valida o evento de rejeição
      expect(termo.domainEvents).toHaveLength(1)
      expect(termo.domainEvents[0]).toBeInstanceOf(
        TermoLiberacaoPorRejeicaoEmitidoEvent
      )
      expect(
        (termo.domainEvents[0] as TermoLiberacaoPorRejeicaoEmitidoEvent).getAggregateId()
      ).toEqual(termo.getId())
    })
  })

  describe('Reconstituição de Instância (com ID existente)', () => {
    it('não deve disparar eventos de domínio se o ID for fornecido', () => {
      const idExistente = new UniqueEntityID('termo-existente-999')

      const termo = TermoLiberacao.criar(
        {
          ordemServicoId,
          placaVeiculo,
          motivo: 'PAGAMENTO_APROVADO',
        },
        idExistente
      )

      expect(termo.getId().toValue()).toBe('termo-existente-999')
      expect(termo.domainEvents).toHaveLength(0)
    })
  })
})