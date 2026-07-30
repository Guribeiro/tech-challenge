import { OrdemServico } from '../../domain/entities/ordem-servico.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { OrdemServicoServico } from '../../domain/entities/ordem-servico-servico.js'
import { OrdemServicoComponente } from '../../domain/entities/ordem-servico-componente.js'

// Importação dos Eventos de Domínio
import { DiagnosticoInicializadoEvent } from '../../domain/events/diagnostico-inicializado-event.js'
import { DiagnosticoConcluidoEvent } from '../../domain/events/diagnostico-concluido-event.js'
import { OSExecucaoAutorizadaEvent } from '../../domain/events/os-execucao-autorizada-event.js'
import { OSExecucaoIniciadaEvent } from '../../domain/events/os-execucao-iniciada-event.js'
import { OSExecucaoFinalizadaEvent } from '../../domain/events/os-execucao-finalizada-event.js'
import { OSEncerradaPorRejeicaoEvent } from '../../domain/events/os-encerrada-por-rejeicao-event.js'
import { OSEncerradaEvent } from '../../domain/events/os-encerrada-event.js'

describe('Entidade: OrdemServico', () => {
  const clienteId = new UniqueEntityID('cliente-1')
  const veiculoId = new UniqueEntityID('veiculo-1')
  const mecanicoId = new UniqueEntityID('mecanico-1')

  const makePropsValidas = () => ({
    clienteId,
    veiculoId,
    descricao: 'Barulho na suspensão dianteira ao passar em lombadas.',
    prioridade: Prioridade.restaurar('MEDIA', 2),
    eGarantia: false,
  })

  describe('Criação da Ordem de Serviço (criar)', () => {
    it('deve criar uma OS no status RECEBIDA com prioridade restaurada corretamente', () => {
      const os = OrdemServico.criar(makePropsValidas())

      expect(os.getId().toValue()).toBeDefined()
      expect(os.getClienteId().toValue()).toBe(clienteId.toValue())
      expect(os.getVeiculoId().toValue()).toBe(veiculoId.toValue())
      expect(os.getStatus()).toBe('RECEBIDA')
      expect(os.getPrioridade().getTipo()).toBe('MEDIA')
      expect(os.getPrioridade().getPeso()).toBe(2)
      expect(os.getServicos().getItems()).toHaveLength(0)
      expect(os.getComponentes().getItems()).toHaveLength(0)
      expect(os.getCriadoEm()).toBeInstanceOf(Date)
    })

    it('deve permitir a criação de OS com prioridade calculada dinamicamente', () => {
      const prioridadeCalculada = Prioridade.calcular({
        eGarantia: true,
        eClienteCorporativo: true,
        anoVeiculo: 2025,
        categoriasDosServicos: ['SEGURANCA'],
      }) // 40 + 30 + 15 + 50 = 135 pontos -> URGENTE (peso 4)

      const os = OrdemServico.criar({
        ...makePropsValidas(),
        prioridade: prioridadeCalculada,
      })

      expect(os.getPrioridade().getTipo()).toBe('URGENTE')
      expect(os.getPrioridade().getPeso()).toBe(4)
    })

    it('não deve emitir eventos de domínio na criação da OS', () => {
      const os = OrdemServico.criar(makePropsValidas())

      expect(os.domainEvents).toHaveLength(0)
    })

    it('deve lançar erro se clienteId, veiculoId ou descricao não forem fornecidos', () => {
      expect(() => {
        OrdemServico.criar({
          ...makePropsValidas(),
          descricao: '   ',
        })
      }).toThrow('Cliente, veículo e descrição são obrigatórios para uma ordem de serviço.')
    })
  })

  describe('Fluxo do Diagnóstico', () => {
    it('deve iniciar o diagnóstico alterando status para EM_DIAGNOSTICO e disparar DiagnosticoInicializadoEvent', () => {
      const os = OrdemServico.criar(makePropsValidas())

      os.iniciarDiagnostico(mecanicoId)

      expect(os.getStatus()).toBe('EM_DIAGNOSTICO')
      expect(os.getMecanicoId()?.toValue()).toBe(mecanicoId.toValue())

      // Validação do evento
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(DiagnosticoInicializadoEvent)
    })

    it('deve lançar erro ao tentar iniciar diagnóstico em uma OS que não está RECEBIDA', () => {
      const os = OrdemServico.criar(makePropsValidas())
      os.iniciarDiagnostico(mecanicoId)

      expect(() => {
        os.iniciarDiagnostico(mecanicoId)
      }).toThrow('O diagnóstico só pode ser iniciado para ordens de serviço recebidas.')
    })

    it('deve concluir o diagnóstico alterando status para AGUARDANDO_APROVACAO e disparar DiagnosticoConcluidoEvent', () => {
      const os = OrdemServico.criar(makePropsValidas())
      os.iniciarDiagnostico(mecanicoId)
      os.clearEvents()

      const servico = OrdemServicoServico.criar({
        ordemServicoId: os.getId(),
        servicoId: new UniqueEntityID('servico-1'),
        precoUnitario: 1000,
        categoria: 'ELETRICA',
        nome: 'Servico 01',
      })

      const componente = OrdemServicoComponente.criar({
        ordemServicoId: os.getId(),
        produtoId: new UniqueEntityID('produto-1'),
        descricao: 'Amortecedor Dianteiro',
        quantidade: 2,
        precoUnitario: 25000,
        nome: 'Componente 01',
        precoCusto: 20000,
        tipo: 'INSUMO'
      })

      os.concluirDiagnostico([servico], [componente])

      expect(os.getStatus()).toBe('AGUARDANDO_APROVACAO')
      expect(os.getServicos().getItems()).toHaveLength(1)
      expect(os.getComponentes().getItems()).toHaveLength(1)

      // Validação do evento
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(DiagnosticoConcluidoEvent)
    })

    it('deve lançar erro ao concluir diagnóstico se status não for EM_DIAGNOSTICO', () => {
      const os = OrdemServico.criar(makePropsValidas())

      expect(() => {
        os.concluirDiagnostico()
      }).toThrow('A ordem de serviço precisa estar EM_DIAGNOSTICO para concluir esta etapa.')
    })
  })

  describe('Fluxo de Execução', () => {
    function prepararOSParaExecucao(): OrdemServico {
      const os = OrdemServico.criar(makePropsValidas())
      os.iniciarDiagnostico(mecanicoId)
      os.concluirDiagnostico()
      os.clearEvents()
      return os
    }

    it('deve autorizar a execução alterando status para AUTORIZADA e disparar OSExecucaoAutorizadaEvent', () => {
      const os = prepararOSParaExecucao()

      os.autorizaExecucao()

      expect(os.getStatus()).toBe('AUTORIZADA')
      expect(os.getAtualizadoEm()).toBeInstanceOf(Date)
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(OSExecucaoAutorizadaEvent)
    })

    it('deve marcar como pronta para iniciar alterando status para PRONTA_PARA_INICIAR', () => {
      const os = prepararOSParaExecucao()
      os.autorizaExecucao()

      os.marcarComoProntaParaIniciar()

      expect(os.getStatus()).toBe('PRONTA_PARA_INICIAR')
    })

    it('deve iniciar a execução alterando status para EM_EXECUCAO e disparar OSExecucaoIniciadaEvent', () => {
      const os = prepararOSParaExecucao()
      os.autorizaExecucao()
      os.marcarComoProntaParaIniciar()
      os.clearEvents()

      os.iniciaExecucao()

      expect(os.getStatus()).toBe('EM_EXECUCAO')
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(OSExecucaoIniciadaEvent)
    })

    it('deve finalizar a execução alterando status para FINALIZADA e disparar OSExecucaoFinalizadaEvent', () => {
      const os = prepararOSParaExecucao()
      os.autorizaExecucao()
      os.marcarComoProntaParaIniciar()
      os.iniciaExecucao()
      os.clearEvents()

      os.finalizaExecucao()

      expect(os.getStatus()).toBe('FINALIZADA')
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(OSExecucaoFinalizadaEvent)
    })
  })

  describe('Fluxos de Encerramento', () => {
    it('deve encerrar por rejeição e disparar OSEncerradaPorRejeicaoEvent', () => {
      const os = OrdemServico.criar(makePropsValidas())

      os.encerrarPorRejeicao()

      expect(os.getStatus()).toBe('ENCERRADA_REJEICAO')
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(OSEncerradaPorRejeicaoEvent)
    })

    it('deve lançar erro ao tentar encerrar por rejeição uma OS já encerrada por rejeição', () => {
      const os = OrdemServico.criar(makePropsValidas())
      os.encerrarPorRejeicao()

      expect(() => {
        os.encerrarPorRejeicao()
      }).toThrow('Não é possível encerrar uma Ordem de Serviço que já foi concluída.')
    })

    it('deve encerrar por fatura paga e disparar OSEncerradaEvent', () => {
      const os = OrdemServico.criar(makePropsValidas())

      os.encerrarPorFaturaPaga()

      expect(os.getStatus()).toBe('ENCERRADA')
      expect(os.domainEvents).toHaveLength(1)
      expect(os.domainEvents[0]).toBeInstanceOf(OSEncerradaEvent)
    })
  })

  describe('Cálculos e Utilitários', () => {
    it('deve calcular corretamente o valor total unindo serviços e componentes', () => {
      const os = OrdemServico.criar(makePropsValidas())

      const servico1 = OrdemServicoServico.criar({
        ordemServicoId: os.getId(),
        servicoId: new UniqueEntityID('s1'),
        precoUnitario: 15000,
        categoria: 'ELETRICA',
        nome: 'Servico 01',
      })

      const componente1 = OrdemServicoComponente.criar({
        ordemServicoId: os.getId(),
        produtoId: new UniqueEntityID('p1'),
        descricao: 'Óleo de Motor',
        quantidade: 4,
        precoUnitario: 4000, // Subtotal: 160.0
        nome: 'Componente 01',
        precoCusto: 20000,
        tipo: 'INSUMO'
      })

      os.getServicos().add(servico1)
      os.getComponentes().add(componente1)

      expect(os.getValorTotalCalculado()).toBe(31000) // 150 + 160
    })

    it('deve gerar representação JSON válida', () => {
      const os = OrdemServico.criar(makePropsValidas())
      const json = os.toJSON()

      expect(json).toHaveProperty('id')
      expect(json).toHaveProperty('clienteId')
      expect(json).toHaveProperty('veiculoId')
      expect(json.descricao).toBe('Barulho na suspensão dianteira ao passar em lombadas.')
    })
  })
})