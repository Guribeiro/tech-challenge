import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js';

export type CategoriaServico = 'SEGURANCA' | 'MANUTENCAO_PREVENTIVA' | 'ESTETICA' | 'ELETRICA' | 'MECANICA_GERAL';

export type ServicoProps = {
  categoria: CategoriaServico
  nome: string
  descricao?: string
  valorReferencia: number
}

export class Servico extends Entity<ServicoProps> {
  public static criar(props: ServicoProps, id?: UniqueEntityID): Servico {

    this.validar(props)
    return new Servico(props, id)
  }

  private static validar(props: ServicoProps) {
    if (!props.nome?.trim()) {
      throw new Error('Nome do serviço é obrigatório.')
    }

    if (!props.categoria) {
      throw new Error('A categoria do serviço é obrigatória para fins de priorização e enturmação.')
    }

    if (props.valorReferencia !== undefined && props.valorReferencia < 0) {
      throw new Error('Valor de referência não pode ser negativo.')
    }

  }

  public getNome(): string {
    return this.props.nome
  }

  public getCategoria(): CategoriaServico {
    return this.props.categoria
  }

  public getDescricao(): string | undefined {
    return this.props.descricao
  }

  public getValorReferencia(): number {
    return this.props.valorReferencia
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      nome: this.props.nome,
      descricao: this.props.descricao,
      valorReferencia: this.props.valorReferencia,
    }
  }
}
