import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'

export interface OrcamentoServicoProps {
  servicoId: UniqueEntityID
  orcamentoId: UniqueEntityID
  nome: string
  categoria: CategoriaServico
  precoUnitario: number
  descricao?: string
  observacao?: string
  criadoEm: Date
}

export class OrcamentoServico extends Entity<OrcamentoServicoProps> {
  public static criar(props: Optional<OrcamentoServicoProps, 'criadoEm'>, id?: UniqueEntityID) {
    this.validar(props)

    return new OrcamentoServico({
      ...props,
      criadoEm: props.criadoEm ?? new Date()
    }, id)
  }

  private static validar(props: Optional<OrcamentoServicoProps, 'criadoEm'>) {
    if (props.precoUnitario < 0) {
      throw new Error('O valor cobrado pelo serviço não pode ser negativo.')
    }
  }
  // Getters explícitos para a Orcamento usar no cálculo
  public getOrcamentoId(): UniqueEntityID { return this.props.orcamentoId }
  public getServicoId(): UniqueEntityID { return this.props.servicoId }
  public getPrecoUnitario(): number { return this.props.precoUnitario }
  public getNome(): string { return this.props.nome }
  public getCategoria(): CategoriaServico { return this.props.categoria }
  public getDescricao(): string | undefined { return this.props.descricao }
  public getObservacao(): string | undefined { return this.props.observacao }
  public getCriadoEm(): Date { return this.props.criadoEm }
}