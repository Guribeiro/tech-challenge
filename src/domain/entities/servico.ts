import { Entity } from '@/core/entities/entity.js'

export type ServicoProps = {
  id?: string
  nome: string
  descricao?: string
  valorReferencia?: number
}

export class Servico extends Entity<ServicoProps> {

  public static criar(props: ServicoProps): Servico {
    if (!props.nome?.trim()) {
      throw new Error('Nome do serviço é obrigatório.')
    }

    if (props.valorReferencia !== undefined && props.valorReferencia < 0) {
      throw new Error('Valor de referência não pode ser negativo.')
    }

    return new Servico(props)
  }

  public getNome(): string {
    return this.props.nome
  }

  public getDescricao(): string | undefined {
    return this.props.descricao
  }

  public getValorReferencia(): number | undefined {
    return this.props.valorReferencia
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      nome: this.props.nome,
      descricao: this.props.descricao,
      valorReferencia: this.props.valorReferencia
    }
  }
}
