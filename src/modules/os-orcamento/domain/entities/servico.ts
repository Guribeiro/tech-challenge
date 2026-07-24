import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js';
import { Optional } from '@/core/types/optional.js';

export type CategoriaServico = 'SEGURANCA' | 'MANUTENCAO_PREVENTIVA' | 'ESTETICA' | 'ELETRICA' | 'MECANICA_GERAL';

export type ServicoProps = {
  categoria: CategoriaServico
  nome: string
  descricao?: string
  valorReferencia: number
  criadoEm: Date
  atualizadoEm?: Date
  desativadoEm?: Date | null
}

export type AtualizarServcoProps = Partial<{
  categoria: CategoriaServico
  nome: string
  descricao: string
  valorReferencia: number
}>

export class Servico extends Entity<ServicoProps> {
  public static criar(props: Optional<ServicoProps, 'criadoEm'>, id?: UniqueEntityID): Servico {

    this.validar(props)

    return new Servico({
      ...props,
      criadoEm: props.criadoEm ?? new Date()
    }, id)
  }

  private static validar(props: Optional<ServicoProps, 'criadoEm'>) {
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

  public atualizar(props: AtualizarServcoProps): void {
    this.props.nome = props.nome ?? this.props.nome
    this.props.categoria = props.categoria ?? this.props.categoria
    this.props.descricao = props.descricao ?? this.props.descricao
    this.props.valorReferencia = props.valorReferencia ?? this.props.valorReferencia

    Servico.validar(this.props)
    this.touch()
  }

  private touch() {
    this.props.atualizadoEm = new Date()
  }

  public desativar(): void {
    if (this.props.desativadoEm) {
      throw new Error('Este produto já está desativado.')
    }
    this.props.desativadoEm = new Date()
    this.touch()
  }

  public reativar(): void {
    this.props.desativadoEm = null
    this.touch()
  }

  public isAtivo(): boolean {
    return this.props.desativadoEm === null
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

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }
  public getDesativadoEm(): Date | null | undefined {
    return this.props.desativadoEm
  }

  public isDesativado() {
    return !!this.props.desativadoEm
  }

}
