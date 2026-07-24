import { Entity } from '@/core/entities/entity.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { Cpf } from './value-objects/cpf.js'

export interface ClienteProps {
  nome: NomeCompleto
  email: Email
  telefone: Telefone
  cpf: Cpf
  tipo: 'PF' | 'PJ'
  criadoEm: Date
  atualizadoEm?: Date
  deletadoEm?: Date | null
}

export type AtualizarClienteProps = Partial<{
  nome: NomeCompleto
  email: Email
  telefone: Telefone
  cpf: Cpf
  tipo: 'PF' | 'PJ'
}>

export class Cliente extends Entity<ClienteProps> {
  public static criar(props: Optional<ClienteProps, 'criadoEm'>, id?: UniqueEntityID): Cliente {

    this.validar(props)

    return new Cliente({
      ...props,
      criadoEm: props.criadoEm ?? new Date(),
      deletadoEm: props.deletadoEm ?? null,
    }, id)
  }

  public atualizar(props: AtualizarClienteProps) {
    this.props.nome = props.nome ?? this.props.nome
    this.props.cpf = props.cpf ?? this.props.cpf
    this.props.email = props.email ?? this.props.email
    this.props.telefone = props.telefone ?? this.props.telefone
    this.props.tipo = props.tipo ?? this.props.tipo

    Cliente.validar(this.props)

    this.touch()
  }

  private static validar(props: Optional<ClienteProps, 'criadoEm'>) {
    if (!props.nome.getValor()?.trim()) {
      throw new Error('Nome do cliente é obrigatório.')
    }

    if (!props.cpf?.getValor().trim()) {
      throw new Error('CPF do mecânico é obrigatório.')
    }

    if (!props.email.getValor()?.trim()) {
      throw new Error('Email do cliente é obrigatório.')
    }
  }

  private touch() {
    this.props.atualizadoEm = new Date()
  }

  public deletar(): void {
    if (this.props.deletadoEm) {
      throw new Error('Este cliente já está excluído.')
    }

    this.props.deletadoEm = new Date()
    this.touch()
  }

  public isDeletado(): boolean {
    return !!this.props.deletadoEm
  }

  public getDeletadoEm(): Date | null | undefined {
    return this.props.deletadoEm
  }

  public getNome(): NomeCompleto {
    return this.props.nome
  }

  public getEmail(): Email {
    return this.props.email
  }

  public getCpf(): Cpf {
    return this.props.cpf
  }

  public getTelefone(): Telefone {
    return this.props.telefone
  }

  public getTipo(): 'PF' | 'PJ' {
    return this.props.tipo
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

}
