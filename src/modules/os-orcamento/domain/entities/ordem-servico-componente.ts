import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { TipoProduto, UnidadeMedida } from '@/modules/estoque/domain/entities/produto.js'

export interface OrdemServicoComponenteProps {
  ordemServicoId: UniqueEntityID
  produtoId: UniqueEntityID
  nome: string
  tipo: TipoProduto
  marca?: string
  codigoSKU?: string
  codigoFabricante?: string
  descricao?: string
  quantidade: number
  precoCusto: number
  precoUnitario: number
  unidadeMedida?: UnidadeMedida
  criadoEm: Date
}

export class OrdemServicoComponente extends Entity<OrdemServicoComponenteProps> {

  public static criar(props: Optional<OrdemServicoComponenteProps, 'criadoEm'>, id?: UniqueEntityID) {
    this.validar(props)

    return new OrdemServicoComponente({
      ...props,
      criadoEm: props.criadoEm ?? new Date()
    }, id)
  }

  private static validar(props: Optional<OrdemServicoComponenteProps, 'criadoEm'>) {
    if (props.quantidade <= 0) {
      throw new Error('A quantidade de um componente na OS deve ser maior que zero.')
    }

    if (props.precoUnitario < 0) {
      throw new Error('O valor unitário do componente não pode ser negativo.')
    }
  }

  // Encapsula o cálculo do subtotal da linha
  public getSubtotal(): number {
    return this.props.precoUnitario * this.props.quantidade
  }

  /* Getters */
  public getNome(): string { return this.props.nome }
  public getTipo(): TipoProduto { return this.props.tipo }
  public getMarca(): string | undefined { return this.props.marca }
  public getCodigoSKU(): string | undefined {
    return this.props.codigoSKU
  }
  public getCodigoFabricante(): string | undefined {
    return this.props.codigoFabricante
  }
  public getPrecoUnitario(): number {
    return this.props.precoUnitario
  }
  public getPrecoCusto(): number {
    return this.props.precoCusto
  }
  public getUnidadeMedida(): UnidadeMedida | undefined {
    return this.props.unidadeMedida
  }

  public getOrdemServicoId(): UniqueEntityID { return this.props.ordemServicoId }
  public getProdutoId(): UniqueEntityID { return this.props.produtoId }
  public getDescricao(): string | undefined { return this.props.descricao }
  public getQuantidade(): number { return this.props.quantidade }
  public getCriadoEm(): Date { return this.props.criadoEm }
}