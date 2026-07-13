import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { OrdemServicoServico } from './value-objects/ordem-servico-servico.js'
import { OrdemServicoComponente } from './value-objects/ordem-servico-componente.js'
import { OrcamentoEnviadoEvent } from '../events/orcamento-enviado-event.js'

export type StatusOrcamento =
  | 'CRIADO'
  | 'ENVIADO'
  | 'APROVADO'
  | 'RECUSADO'
  | 'RENEGOCIADO'
  | 'REJEITADO_DEFINITIVO'

export interface OrcamentoProps {
  ordemServicoId: UniqueEntityID
  clienteId: UniqueEntityID
  versao: number
  servicos: OrdemServicoServico[]
  componentes: OrdemServicoComponente[]
  status: StatusOrcamento
  criadoEm: Date
  atualizadoEm?: Date
}

export class Orcamento extends AggregateRoot<OrcamentoProps> {
  public static criar(
    props: Optional<OrcamentoProps, 'status' | 'versao' | 'criadoEm'>,
    id?: string
  ): Orcamento {
    return new Orcamento({
      ...props,
      status: props.status ?? 'CRIADO',
      versao: props.versao ?? 1,
      criadoEm: props.criadoEm ?? new Date()
    }, id)
  }

  /* -------------------------------------------------------------------------- */
  /* REGRAS DE NEGÓCIO DO SEU EVENT STORMING                                    */
  /* -------------------------------------------------------------------------- */

  public enviar(): void {
    if (this.props.status !== 'CRIADO' && this.props.status !== 'RENEGOCIADO') {
      throw new Error('Apenas orçamentos criados ou renegociados podem ser enviados.')
    }
    this.props.status = 'ENVIADO'

    // Evento: "orçamento enviado para o cliente" -> Dispara notificação
    this.addDomainEvent(new OrcamentoEnviadoEvent(this))
  }

  public aprovar(): void {
    if (this.props.status !== 'ENVIADO') {
      throw new Error('O orçamento precisa ser enviado ao cliente antes de ser aprovado.')
    }
    this.props.status = 'APROVADO'

    // Evento: "Cliente aprovou orçamento" -> Ouvinte vai na OS e muda para EM_EXECUCAO
    // this.addDomainEvent(new OrcamentoAprovadoEvent(this))
  }

  public recusar(): void {
    if (this.props.status !== 'ENVIADO') {
      throw new Error('Apenas orçamentos enviados podem ser recusados.')
    }

    // Se já estava no status de renegociado antes de ser enviado e o cliente recusou de novo...
    if (this.props.versao > 1) {
      this.props.status = 'REJEITADO_DEFINITIVO'
      // Evento: "Cliente rejeitou orçamento renegociado" -> Encerra processo da OS
    } else {
      this.props.status = 'RECUSADO'
      // Evento: "Cliente recusou orçamento" -> Notifica recepcionista para renegociar
    }
  }

  public renegociar(novosServicos: OrdemServicoServico[], novosComponentes: OrdemServicoComponente[]): void {
    if (this.props.status !== 'RECUSADO') {
      throw new Error('Só é possível renegociar um orçamento que foi recusado pelo cliente.')
    }

    this.props.servicos = novosServicos
    this.props.componentes = novosComponentes
    this.props.versao += 1
    this.props.status = 'RENEGOCIADO'
    this.props.atualizadoEm = new Date()
  }

  /* Getters e Métodos de Soma... */

  /* -------------------------------------------------------------------------- */
  /* MÉTODOS DE SOMA (CÁLCULOS FINANCEIROS)                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Calcula o valor total apenas dos serviços inclusos no orçamento.
   */
  public getValorTotalServicos(): number {
    return this.props.servicos.reduce((acc, servico) => {
      return acc + servico.getPrecoUnitario()
    }, 0)
  }

  /**
   * Calcula o valor total apenas dos componentes (peças e insumos) do orçamento,
   * invocando a regra de subtotal de cada item.
   */
  public getValorTotalComponentes(): number {
    return this.props.componentes.reduce((acc, componente) => {
      return acc + componente.getSubtotal()
    }, 0)
  }

  /**
   * Calcula o valor total geral do orçamento (Serviços + Componentes).
   * Este é o valor final que o cliente verá para aprovação.
   */
  public getValorTotalGeral(): number {
    return this.getValorTotalServicos() + this.getValorTotalComponentes()
  }

  /* -------------------------------------------------------------------------- */
  /* GETTERS DA ENTIDADE                                                        */
  /* -------------------------------------------------------------------------- */

  public getOrdemServicoId(): UniqueEntityID {
    return this.props.ordemServicoId
  }

  public getClientId(): UniqueEntityID {
    return this.props.clienteId
  }

  public getVersao(): number {
    return this.props.versao
  }

  public getServicos(): OrdemServicoServico[] {
    return this.props.servicos
  }

  public getComponentes(): OrdemServicoComponente[] {
    return this.props.componentes
  }

  public getStatus(): StatusOrcamento {
    return this.props.status
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }
}