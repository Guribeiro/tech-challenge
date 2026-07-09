import { Entity } from '@/core/entities/entity.js'
import { Email } from '@/modules/os-orcamento/domain/entities/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'

export interface ClienteProps {
  nome: NomeCompleto
  email: Email
  telefone: Telefone
  tipo: 'PF' | 'PJ'
}

export class Cliente extends Entity<ClienteProps> {
  public static criar(props: ClienteProps, id?: string): Cliente {
    if (!props.nome.getValor()?.trim()) {
      throw new Error('Nome do cliente é obrigatório.')
    }

    if (!props.email.getValor()?.trim()) {
      throw new Error('Email do cliente é obrigatório.')
    }
    return new Cliente(props, id)
  }

  public getNome(): NomeCompleto {
    return this.props.nome
  }

  public getEmail(): Email {
    return this.props.email
  }

  public getTelefone(): Telefone {
    return this.props.telefone
  }

  public getTipo(): 'PF' | 'PJ' {
    return this.props.tipo
  }

  public toJSON(): Record<string, unknown> {
    return {
      nome: this.getNome(),
      email: this.getEmail(),
      telefone: this.getTelefone(),
    }
  }
}
