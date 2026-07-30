import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { OrcamentoEnviadoEvent } from '../events/orcamento-enviado-event.js'
import { OrcamentoAprovadoEvent } from '../events/orcamento-aprovado-event.js'
import { OrcamentoRenegociadoEvent } from '../events/orcamento-renegociado-event.js'
import { OrcamentoRecusadoEvent } from '../events/orcamento-recusado-event.js'
import { OrcamentoRenegociadoRecusadoEvent } from '../events/orcamento-renegociado-recusado-event.js'
import { OrcamentoServicoList } from './value-objects/orcamento-servico-list.js'
import { OrcamentoComponenteList } from './value-objects/orcamento-componente-list.js'
import { OrcamentoServico } from './orcamento-servico.js'
import { OrcamentoComponente } from './orcamento-componente.js'

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
  servicos: OrcamentoServicoList
  componentes: OrcamentoComponenteList
  descontoPorcentagem: number
  status: StatusOrcamento
  criadoEm: Date
  atualizadoEm?: Date
}

export class Orcamento extends AggregateRoot<OrcamentoProps> {
  public static criar(
    props: Optional<OrcamentoProps, 'status' | 'versao' | 'criadoEm' | 'descontoPorcentagem'>,
    id?: UniqueEntityID
  ): Orcamento {
    return new Orcamento({
      ...props,
      status: props.status ?? 'CRIADO',
      versao: props.versao ?? 1,
      componentes: props.componentes ?? new OrcamentoServicoList(),
      servicos: props.servicos ?? new OrcamentoServicoList(),
      descontoPorcentagem: props.descontoPorcentagem ?? 0,
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
    if (!['ENVIADO', 'RENEGOCIADO'].includes(this.props.status)) {
      throw new Error('O orçamento precisa ser enviado ao cliente antes de ser aprovado.')
    }
    this.props.status = 'APROVADO'

    // Evento: "Cliente aprovou orçamento" -> Ouvinte vai na OS e muda para EM_EXECUCAO
    this.addDomainEvent(new OrcamentoAprovadoEvent(this))
  }

  public recusar(): void {
    if (!['ENVIADO', 'RENEGOCIADO'].includes(this.props.status)) {
      throw new Error('Apenas orçamentos enviados ou renegociados podem ser recusados.')
    }

    // Se já estava no status de renegociado antes de ser enviado e o cliente recusou de novo...
    if (this.props.versao > 1) {
      this.props.status = 'REJEITADO_DEFINITIVO'
      // Evento: "Cliente rejeitou orçamento renegociado" -> Encerra processo da OS
      this.addDomainEvent(new OrcamentoRenegociadoRecusadoEvent(this))
    } else {
      this.props.status = 'RECUSADO'
      this.addDomainEvent(new OrcamentoRecusadoEvent(this))
    }
  }

  public renegociar(
    servicos: OrcamentoServico[],
    componentes: OrcamentoComponente[],
    descontoPorcentagem: number,
  ): void {

    if (this.props.status !== 'RECUSADO') {
      throw new Error('Só é possível renegociar um orçamento que foi recusado pelo cliente.')
    }

    if (descontoPorcentagem < 0 || descontoPorcentagem > 100) {
      throw new Error('O desconto em porcentagem deve estar entre 0 e 100.')
    }

    if (servicos) {
      this.props.servicos.update(servicos)
    }

    if (componentes) {
      this.props.componentes.update(componentes)
    }

    this.props.descontoPorcentagem = descontoPorcentagem
    this.props.versao += 1
    this.props.status = 'RENEGOCIADO'
    this.props.atualizadoEm = new Date()

    this.addDomainEvent(new OrcamentoRenegociadoEvent(this))
  }

  /* Getters e Métodos de Soma... */

  /* -------------------------------------------------------------------------- */
  /* MÉTODOS DE SOMA (CÁLCULOS FINANCEIROS)                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Calcula o valor total apenas dos serviços inclusos no orçamento.
   */
  public getValorTotalServicos(): number {
    return this.props.servicos.getItems().reduce((acc, servico) => {
      return acc + servico.getPrecoUnitario()
    }, 0)
  }

  /**
   * Calcula o valor total apenas dos componentes (peças e insumos) do orçamento,
   * invocando a regra de subtotal de cada item.
   */
  public getValorTotalComponentes(): number {
    return this.props.componentes.getItems().reduce((acc, componente) => {
      return acc + componente.getSubtotal()
    }, 0)
  }

  /**
   * Calcula o valor total geral do orçamento (Serviços + Componentes).
   * Este é o valor final que o cliente verá para aprovação.
   */
  public getValorBrutoTotal(): number {
    return this.getValorTotalServicos() + this.getValorTotalComponentes()
  }

  /**
   * Calcula o valor monetário do desconto com base na porcentagem aplicada sobre o valor bruto.
   */
  public getValorDesconto(): number {
    const bruto = this.getValorBrutoTotal()
    return (bruto * this.props.descontoPorcentagem) / 100
  }

  /**
   * Calcula o valor total geral do orçamento (Bruto - Desconto calculado).
   */
  public getValorTotalGeral(): number {
    const bruto = this.getValorBrutoTotal()
    const desconto = this.getValorDesconto()

    return bruto - desconto
  }
  /* -------------------------------------------------------------------------- */
  /* GETTERS DA ENTIDADE                                                        */
  /* -------------------------------------------------------------------------- */

  public getOrdemServicoId(): UniqueEntityID {
    return this.props.ordemServicoId
  }

  public getClienteId(): UniqueEntityID {
    return this.props.clienteId
  }

  public getVersao(): number {
    return this.props.versao
  }

  public getServicos(): OrcamentoServicoList {
    return this.props.servicos
  }

  public getComponentes(): OrcamentoComponenteList {
    return this.props.componentes
  }

  public getDescontoPorcentagem(): number {
    return this.props.descontoPorcentagem
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