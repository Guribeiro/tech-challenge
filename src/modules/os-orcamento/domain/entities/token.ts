import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { TokenType } from './value-objects/token-type.js'

export interface TokenProps {
  token: string
  tipo: TokenType
  usado: boolean
  expiraEm: Date
  orcamentoId?: string | null
  criadoEm: Date
}

export class Token extends Entity<TokenProps> {
  public getToken(): string {
    return this.props.token
  }

  public getTipo(): TokenType {
    return this.props.tipo
  }

  public getUsado(): boolean {
    return this.props.usado
  }

  public getExpiraEm(): Date {
    return this.props.expiraEm
  }

  public getOrcamentoId(): string | null | undefined {
    return this.props.orcamentoId
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public estaExpirado(): boolean {
    return new Date() > this.props.expiraEm
  }

  public marcarComoUsado(): void {
    this.props.usado = true
  }

  static create(
    props: Optional<TokenProps, 'token' | 'usado' | 'criadoEm' | 'expiraEm'>,
    id?: UniqueEntityID,
  ): Token {
    const token = new Token(
      {
        ...props,
        token: props.token ?? crypto.randomUUID(),
        usado: props.usado ?? false,
        expiraEm: props.expiraEm ?? new Date(Date.now() + 24 * 60 * 60 * 1000), // Padrão: 24 horas de validade
        criadoEm: props.criadoEm ?? new Date(),
      },
      id,
    )

    return token
  }
}