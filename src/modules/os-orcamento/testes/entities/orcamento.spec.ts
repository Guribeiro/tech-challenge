import { describe, it, expect } from 'vitest'
import { Orcamento } from '../../domain/entities/orcamento.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrcamentoServico } from '../../domain/entities/orcamento-servico.js'
import { OrcamentoComponente } from '../../domain/entities/orcamento-componente.js'
import { OrcamentoServicoList } from '../../domain/entities/value-objects/orcamento-servico-list.js'
import { OrcamentoComponenteList } from '../../domain/entities/value-objects/orcamento-componente-list.js'

// Importação dos Eventos de Domínio
import { OrcamentoEnviadoEvent } from '../../domain/events/orcamento-enviado-event.js'
import { OrcamentoAprovadoEvent } from '../../domain/events/orcamento-aprovado-event.js'
import { OrcamentoRecusadoEvent } from '../../domain/events/orcamento-recusado-event.js'
import { OrcamentoRenegociadoEvent } from '../../domain/events/orcamento-renegociado-event.js'
import { OrcamentoRenegociadoRecusadoEvent } from '../../domain/events/orcamento-renegociado-recusado-event.js'

describe('Entidade: Orcamento', () => {
  const ordemServicoId = new UniqueEntityID('os-1')
  const clienteId = new UniqueEntityID('cliente-1')

  const makePropsValidas = () => ({
    ordemServicoId,
    clienteId,
    servicos: new OrcamentoServicoList(),
    componentes: new OrcamentoComponenteList(),
  })

  describe('Criação (criar)', () => {
    it('deve criar um orçamento no status CRIADO com versão 1 e desconto 0%', () => {
      const orcamento = Orcamento.criar(makePropsValidas())

      expect(orcamento.getId().toValue()).toBeDefined()
      expect(orcamento.getOrdemServicoId().toValue()).toBe(ordemServicoId.toValue())
      expect(orcamento.getClienteId().toValue()).toBe(clienteId.toValue())
      expect(orcamento.getStatus()).toBe('CRIADO')
      expect(orcamento.getVersao()).toBe(1)
      expect(orcamento.getDescontoPorcentagem()).toBe(0)
      expect(orcamento.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('não deve disparar eventos de domínio na criação', () => {
      const orcamento = Orcamento.criar(makePropsValidas())

      expect(orcamento.domainEvents).toHaveLength(0)
    })
  })

  describe('Fluxo de Transições de Status e Eventos', () => {
    it('deve enviar um orçamento no status CRIADO e disparar OrcamentoEnviadoEvent', () => {
      const orcamento = Orcamento.criar(makePropsValidas())

      orcamento.enviar()

      expect(orcamento.getStatus()).toBe('ENVIADO')
      expect(orcamento.domainEvents).toHaveLength(1)
      expect(orcamento.domainEvents[0]).toBeInstanceOf(OrcamentoEnviadoEvent)
    })

    it('deve lançar erro ao tentar enviar um orçamento com status diferente de CRIADO ou RENEGOCIADO', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar() // Status: ENVIADO

      expect(() => {
        orcamento.enviar()
      }).toThrow('Apenas orçamentos criados ou renegociados podem ser enviados.')
    })

    it('deve aprovar um orçamento no status ENVIADO e disparar OrcamentoAprovadoEvent', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar()
      orcamento.clearEvents()

      orcamento.aprovar()

      expect(orcamento.getStatus()).toBe('APROVADO')
      expect(orcamento.domainEvents).toHaveLength(1)
      expect(orcamento.domainEvents[0]).toBeInstanceOf(OrcamentoAprovadoEvent)
    })

    it('deve lançar erro ao tentar aprovar um orçamento que não foi enviado ou renegociado', () => {
      const orcamento = Orcamento.criar(makePropsValidas())

      expect(() => {
        orcamento.aprovar()
      }).toThrow('O orçamento precisa ser enviado ao cliente antes de ser aprovado.')
    })

    it('deve recusar um orçamento na versão 1 alterando status para RECUSADO e disparar OrcamentoRecusadoEvent', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar()
      orcamento.clearEvents()

      orcamento.recusar()

      expect(orcamento.getStatus()).toBe('RECUSADO')
      expect(orcamento.domainEvents).toHaveLength(1)
      expect(orcamento.domainEvents[0]).toBeInstanceOf(OrcamentoRecusadoEvent)
    })

    it('deve recusar um orçamento renegociado (versão > 1) alterando status para REJEITADO_DEFINITIVO e disparar OrcamentoRenegociadoRecusadoEvent', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar()
      orcamento.recusar()

      // Renegocia e envia para versão 2
      orcamento.renegociar([], [], 10)
      orcamento.enviar()
      orcamento.clearEvents()

      orcamento.recusar()

      expect(orcamento.getStatus()).toBe('REJEITADO_DEFINITIVO')
      expect(orcamento.domainEvents).toHaveLength(1)
      expect(orcamento.domainEvents[0]).toBeInstanceOf(OrcamentoRenegociadoRecusadoEvent)
    })
  })

  describe('Fluxo de Renegociação', () => {
    it('deve renegociar um orçamento RECUSADO incrementando a versão e alterando status para RENEGOCIADO', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar()
      orcamento.recusar()
      orcamento.clearEvents()

      const servico = OrcamentoServico.criar({
        orcamentoId: orcamento.getId(),
        servicoId: new UniqueEntityID('s1'),
        nome: 'Troca de Correia',
        categoria: 'MANUTENCAO_PREVENTIVA' as const,
        precoUnitario: 20000,
      })

      const componente = OrcamentoComponente.criar({
        orcamentoId: orcamento.getId(),
        produtoId: new UniqueEntityID('p1'),
        nome: 'Correia Dentada',
        tipo: 'PECA' as const,
        quantidade: 1,
        precoCusto: 5000,
        precoUnitario: 8000,
      })

      orcamento.renegociar([servico], [componente], 5)

      expect(orcamento.getStatus()).toBe('RENEGOCIADO')
      expect(orcamento.getVersao()).toBe(2)
      expect(orcamento.getDescontoPorcentagem()).toBe(5)
      expect(orcamento.getServicos().getItems()).toHaveLength(1)
      expect(orcamento.getComponentes().getItems()).toHaveLength(1)
      expect(orcamento.getAtualizadoEm()).toBeInstanceOf(Date)

      expect(orcamento.domainEvents).toHaveLength(1)
      expect(orcamento.domainEvents[0]).toBeInstanceOf(OrcamentoRenegociadoEvent)
    })

    it('deve lançar erro se tentar renegociar um orçamento que não está RECUSADO', () => {
      const orcamento = Orcamento.criar(makePropsValidas())

      expect(() => {
        orcamento.renegociar([], [], 10)
      }).toThrow('Só é possível renegociar um orçamento que foi recusado pelo cliente.')
    })

    it('deve lançar erro se o percentual de desconto for inválido (< 0 ou > 100)', () => {
      const orcamento = Orcamento.criar(makePropsValidas())
      orcamento.enviar()
      orcamento.recusar()

      expect(() => {
        orcamento.renegociar([], [], -5)
      }).toThrow('O desconto em porcentagem deve estar entre 0 e 100.')

      expect(() => {
        orcamento.renegociar([], [], 105)
      }).toThrow('O desconto em porcentagem deve estar entre 0 e 100.')
    })
  })

  describe('Cálculos Financeiros', () => {
    it('deve calcular corretamente o total de serviços, componentes, valor bruto, desconto e valor final', () => {
      const orcamento = Orcamento.criar({
        ...makePropsValidas(),
        descontoPorcentagem: 10, // 10% de desconto
      })

      const servico1 = OrcamentoServico.criar({
        orcamentoId: orcamento.getId(),
        servicoId: new UniqueEntityID('s1'),
        nome: 'Mão de obra',
        categoria: 'ELETRICA' as const,
        precoUnitario: 30000,
      })

      const componente1 = OrcamentoComponente.criar({
        orcamentoId: orcamento.getId(),
        produtoId: new UniqueEntityID('p1'),
        nome: 'Pastilha de Freio',
        tipo: 'PECA' as const,
        quantidade: 2,
        precoCusto: 5000,
        precoUnitario: 10000, // Subtotal: 200.0
      })

      orcamento.getServicos().add(servico1)
      orcamento.getComponentes().add(componente1)

      expect(orcamento.getValorTotalServicos()).toBe(30000)
      expect(orcamento.getValorTotalComponentes()).toBe(20000)
      expect(orcamento.getValorBrutoTotal()).toBe(50000) // 300 + 200
      expect(orcamento.getValorDesconto()).toBe(5000) // 10% de 500
      expect(orcamento.getValorTotalGeral()).toBe(45000) // 500 - 50
    })
  })
})