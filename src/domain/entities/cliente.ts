import { Entity } from "@/core/entities/entity.js"
import { Email } from "@/domain/entities/value-objects/email.js"
import { Telefone } from "@/domain/entities/value-objects/telefone.js"
import { NomeCompleto } from "@/domain/entities/value-objects/nome-completo.js"

interface ClienteProps {
  nome: NomeCompleto
  email: Email
  telefone: Telefone
}

export class Cliente extends Entity<ClienteProps> {

  public static criar(props: ClienteProps, id?: string): Cliente {
    if (!props.nome.getValor()?.trim()) {
      throw new Error('Nome do cliente é obrigatório.')
    }

    if (!props.email.getValor()?.trim()) {
      throw new Error('Email do cliente é obrigatório.')
    }
    return new Cliente(props)
  }

  public getNome(): string {
    return this.props.nome.getValor()
  }

  public getEmail(): string {
    return this.props.email.getValor()
  }

  public getTelefone(): string | undefined {
    return this.props.telefone?.getValor()
  }

  public toJSON(): Record<string, unknown> {
    return {
      nome: this.getNome(),
      email: this.getEmail(),
      telefone: this.getTelefone()
    }
  }

}