import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'

export interface OrdemServicoServicoProps {
  servicoId: UniqueEntityID
  ordemServicoId: UniqueEntityID
  nome: string
  categoria: CategoriaServico
  precoUnitario: number
  descricao?: string
  observacao?: string
  criadoEm: Date
}

export class OrdemServicoServico extends Entity<OrdemServicoServicoProps> {
  public static criar(props: Optional<OrdemServicoServicoProps, 'criadoEm'>, id?: UniqueEntityID) {
    // 1. Cria o objeto garantindo o tipo completo OrdemServicoServicoProps
    const propsCompletas: OrdemServicoServicoProps = {
      ...props,
      criadoEm: props.criadoEm ?? new Date(),
    }

    // 2. Passa as propriedades completas para a validação e o construtor
    this.validar(propsCompletas)

    return new OrdemServicoServico(propsCompletas, id)
  }

  private static validar(props: Optional<OrdemServicoServicoProps, 'criadoEm'>) {
    if (props.precoUnitario < 0) {
      throw new Error('O valor cobrado pelo serviço não pode ser negativo.')
    }
  }
  // Getters explícitos para a OrdemServico usar no cálculo
  public getOrdemServicoId(): UniqueEntityID { return this.props.ordemServicoId }
  public getServicoId(): UniqueEntityID { return this.props.servicoId }
  public getPrecoUnitario(): number { return this.props.precoUnitario }
  public getNome(): string { return this.props.nome }
  public getCategoria(): CategoriaServico { return this.props.categoria }
  public getDescricao(): string | undefined { return this.props.descricao }
  public getObservacao(): string | undefined { return this.props.observacao }
  public getCriadoEm(): Date { return this.props.criadoEm }
}