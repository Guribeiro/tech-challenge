import { Entity } from '@/core/entities/entity.js'
import { Optional } from '@/core/types/optional.js'

export type TipoProduto = 'PECA' | 'INSUMO'

export interface ProdutoProps {
  nome: string
  tipo: TipoProduto
  precoUnitario: number
  quantidadeEstoque: number
  descricao?: string
  criadoEm: Date
  atualizadoEm?: Date
  desativadoEm?: Date | null
}

export class Produto extends Entity<ProdutoProps> {
  public static criar(props: Optional<ProdutoProps, 'criadoEm'>, id?: string): Produto {
    const produto: ProdutoProps = {
      ...props,
      criadoEm: new Date()
    }
    this.validar(produto)
    return new Produto(produto, id)
  }

  private static validar(props: ProdutoProps): void {
    if (!props.nome?.trim()) {
      throw new Error('O nome do produto é obrigatório.')
    }

    if (!props.tipo) {
      throw new Error('O tipo do produto (PECA ou INSUMO) é obrigatório.')
    }

    if (props.precoUnitario < 0) {
      throw new Error('O preço de venda do produto não pode ser negativo.')
    }

    if (props.quantidadeEstoque < 0) {
      throw new Error('A quantidade em estoque não pode ser negativa.')
    }
  }

  /* -------------------------------------------------------------------------- */
  /* COMPORTAMENTOS DE NEGÓCIO (DDD)                                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Atualiza o preço global do produto no catálogo
   */
  public atualizarPreco(novoPreco: number): void {
    if (novoPreco < 0) {
      throw new Error('O novo preço não pode ser negativo.')
    }
    this.props.precoUnitario = novoPreco
  }

  /**
   * Abate a quantidade do estoque quando a OS for executada
   */
  public deduzirEstoque(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('A quantidade a ser deduzida deve ser maior que zero.')
    }
    if (this.props.quantidadeEstoque < quantidade) {
      throw new Error(`Estoque insuficiente para o produto "${this.props.nome}".`)
    }
    this.props.quantidadeEstoque -= quantidade
  }

  /**
   * Adiciona itens ao estoque (ex: entrada de nota fiscal)
   */
  public adicionarEstoque(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('A quantidade a ser adicionada deve ser maior que zero.')
    }
    this.props.quantidadeEstoque += quantidade
  }

  public desativar(): void {
    if (this.props.desativadoEm !== null) {
      throw new Error('Este produto já está desativado.')
    }
    this.props.desativadoEm = new Date() // Grava o timestamp atual
  }

  // Comportamento de reativação (se necessário no futuro)
  public reativar(): void {
    this.props.desativadoEm = null
  }

  // Getter utilitário para facilitar as queries da aplicação
  public isAtivo(): boolean {
    return this.props.desativadoEm === null
  }


  public getNome(): string {
    return this.props.nome
  }
  public getTipo(): TipoProduto {
    return this.props.tipo
  }
  public getPrecoVendaAtual(): number {
    return this.props.precoUnitario
  }
  public getQuantidadeEstoque(): number {
    return this.props.quantidadeEstoque
  }
  public getDescricao(): string | undefined {
    return this.props.descricao
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      nome: this.props.nome,
      tipo: this.props.tipo,
      precoUnitario: this.props.precoUnitario,
      quantidadeEstoque: this.props.quantidadeEstoque,
      descricao: this.props.descricao,
    }
  }
}