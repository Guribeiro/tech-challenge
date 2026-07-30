import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { RegraDeNegocioVioladaError } from '@/core/errors/domain-errors/regra-de-negocio-violada-error.js'
import { Optional } from '@/core/types/optional.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'
import { Injectable } from '@nestjs/common'

export type StatusFatura = 'PENDENTE' | 'PAGA' | 'CANCELADA'

export interface FaturaProps {
  orcamentoId: UniqueEntityID
  valorTotal: number
  status: StatusFatura
  emitidaEm: Date
  pagaEm?: Date | null
}

@Injectable()
export class Fatura extends AggregateRoot<FaturaProps> {
  public static criar(
    props: Optional<FaturaProps, 'status' | 'emitidaEm' | 'pagaEm'>,
    id?: UniqueEntityID
  ): Fatura {
    const fatura = new Fatura({
      ...props,
      status: props.status ?? 'PENDENTE',
      emitidaEm: props.emitidaEm ?? new Date(),
      pagaEm: props.pagaEm ?? null
    }, id)

    if (!id) {
      fatura.addDomainEvent(new FaturaEmitidaEvent(fatura))
    }

    return fatura
  }

  /**
   * Transição de estado: Efetuar pagamento (segundo post-it azul da imagem)
   */
  public pagar(): void {
    if (this.props.status !== 'PENDENTE') {
      throw new RegraDeNegocioVioladaError(`Não é possível pagar uma fatura com status: ${this.props.status}`)
    }

    this.props.status = 'PAGA'
    this.props.pagaEm = new Date()

    this.addDomainEvent(new FaturaPagaEvent(this))
  }

  public estaPaga(): boolean {
    return this.props.status === 'PAGA'
  }

  public getOrcamentoId(): UniqueEntityID { return this.props.orcamentoId }
  public getValorTotal(): number { return this.props.valorTotal }
  public getStatus(): StatusFatura { return this.props.status }
  public getPagaEm(): Date | undefined | null { return this.props.pagaEm }
  public getEmitidaEm(): Date { return this.props.emitidaEm }
}