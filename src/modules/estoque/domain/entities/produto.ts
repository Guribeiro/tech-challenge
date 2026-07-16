import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { Entity } from '@/core/entities/entity.js'
import { Optional } from '@/core/types/optional.js'

export type TipoProduto = 'PECA' | 'INSUMO'

export interface ProdutoProps {
  nome: string
  tipo: TipoProduto
  precoUnitario: number
  quantidadeEstoque: number
  quantidadeReservada: number
  descricao?: string
  criadoEm: Date
  atualizadoEm?: Date
  desativadoEm?: Date | null
}

export class Produto extends AggregateRoot<ProdutoProps> {
  public static criar(props: Optional<ProdutoProps, 'criadoEm' | 'quantidadeReservada' | 'quantidadeEstoque'>, id?: string): Produto {
    const produto: ProdutoProps = {
      ...props,
      quantidadeEstoque: props.quantidadeEstoque ?? 0,
      quantidadeReservada: props.quantidadeReservada ?? 0,
      desativadoEm: null,
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

    if (props.quantidadeReservada < 0) {
      throw new Error('A quantidade reservada não pode ser negativa.')
    }
  }

  /* -------------------------------------------------------------------------- */
  /* COMPORTAMENTOS DE NEGÓCIO (DDD)                                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Reserva itens para uma OS que foi autorizada
   */
  public reservar(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('A quantidade a ser reservada deve ser maior que zero.')
    }

    const quantidadeDisponivel = this.props.quantidadeEstoque - this.props.quantidadeReservada

    if (quantidadeDisponivel < quantidade) {
      throw new Error(
        `Saldo disponível insuficiente do produto "${this.props.nome}" para reserva. ` +
        `Disponível: ${quantidadeDisponivel}, Solicitado: ${quantidade}`
      )
    }

    this.props.quantidadeReservada += quantidade
    this.props.atualizadoEm = new Date()
  }

  /**
   * Quando o mecânico de fato usa a peça (baixa física real)
   * Deduz do estoque físico total e remove da reserva simultaneamente
   */
  public confirmarReservaEDeduzir(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('A quantidade a ser baixada deve ser maior que zero.')
    }
    if (this.props.quantidadeReservada < quantidade) {
      throw new Error(`Tentativa de baixar mais reservas do que o produto "${this.props.nome}" possui atualmente.`)
    }

    this.props.quantidadeReservada -= quantidade
    this.props.quantidadeEstoque -= quantidade
    this.props.atualizadoEm = new Date()
  }

  /**
   * Se o orçamento for cancelado após ser aprovado, devolvemos a reserva ao saldo disponível
   */
  public cancelarReserva(quantidade: number): void {
    if (quantidade <= 0) {
      throw new Error('A quantidade a ser cancelada deve ser maior que zero.')
    }
    if (this.props.quantidadeReservada < quantidade) {
      throw new Error(`Tentativa de cancelar mais reservas do que o produto "${this.props.nome}" possui.`)
    }

    this.props.quantidadeReservada -= quantidade
    this.props.atualizadoEm = new Date()
  }


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
  public getPrecoUnitario(): number {
    return this.props.precoUnitario
  }
  public getQuantidadeEstoque(): number {
    return this.props.quantidadeEstoque
  }
  public getQuantidadeReservada(): number {
    return this.props.quantidadeReservada
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