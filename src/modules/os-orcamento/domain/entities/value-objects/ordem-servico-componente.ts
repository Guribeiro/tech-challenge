import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { TipoProduto } from '@/modules/estoque/domain/entities/produto.js'

export interface OrdemServicoComponenteProps {
  produtoId: UniqueEntityID
  tipo: TipoProduto
  descricao: string
  quantidade: number
  precoUnitario: number // Congela o preço praticado no momento
}

export class OrdemServicoComponente {
  private props: OrdemServicoComponenteProps

  constructor(props: OrdemServicoComponenteProps) {
    if (props.quantidade <= 0) {
      throw new Error('A quantidade de um componente na OS deve ser maior que zero.')
    }

    if (props.precoUnitario < 0) {
      throw new Error('O valor unitário do componente não pode ser negativo.')
    }

    this.props = props
  }

  // Encapsula o cálculo do subtotal da linha
  public getSubtotal(): number {
    return this.props.precoUnitario * this.props.quantidade
  }

  /* Getters */
  public getProdutoId(): UniqueEntityID { return this.props.produtoId }
  public getTipo(): TipoProduto { return this.props.tipo }
  public getDescricao(): string { return this.props.descricao }
  public getQuantidade(): number { return this.props.quantidade }
  public getValorUnitario(): number { return this.props.precoUnitario }
}