// src/modules/faturamento/domain/entities/fatura.ts
import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { Optional } from '@/core/types/optional.js'
import { FaturaEmitidaEvent } from '@/modules/faturamento/domain/events/fatura-emitida-event.js'
import { FaturaPagaEvent } from '@/modules/faturamento/domain/events/fatura-paga-event.js'

export type StatusFatura = 'PENDENTE' | 'PAGA' | 'CANCELADA'

export interface FaturaProps {
  ordemServicoId: string
  valorTotal: number
  status: StatusFatura
  emitidaEm: Date
  pagaEm?: Date | null
}

export class Fatura extends AggregateRoot<FaturaProps> {
  public static criar(
    props: Optional<FaturaProps, 'status' | 'emitidaEm' | 'pagaEm'>,
    id?: string
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
      throw new Error(`Não é possível pagar uma fatura com status: ${this.props.status}`)
    }

    this.props.status = 'PAGA'
    this.props.pagaEm = new Date()

    this.addDomainEvent(new FaturaPagaEvent(this))
  }

  public getOrdemServicoId(): string { return this.props.ordemServicoId }
  public getValorTotal(): number { return this.props.valorTotal }
  public getStatus(): StatusFatura { return this.props.status }
  public getPagaEm(): Date | undefined | null { return this.props.pagaEm }
}