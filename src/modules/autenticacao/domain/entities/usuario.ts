import { AggregateRoot } from "@/core/entities/aggregate-root.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Email } from "@/shared/domain/value-objects/email.js"
import { UsuarioCriadoEvent } from "../events/usuario-criado-event.js"
import { Optional } from "@/core/types/optional.js"

export type Role = 'MECANICO' | 'RECEPCAO' | 'ADMIN' | 'CLIENTE'

interface UsuarioProps {
  email: Email
  senhaHash: string
  role: Role
  criadoEm: Date
  atualizadoEm?: Date
}

export class Usuario extends AggregateRoot<UsuarioProps> {
  static create(props: Optional<UsuarioProps, 'criadoEm'>, id?: UniqueEntityID, senhaPlana?: string): Usuario {

    const usuario = new Usuario({
      ...props,
      criadoEm: new Date()
    }, id)

    if (senhaPlana) {
      usuario.addDomainEvent(new UsuarioCriadoEvent(usuario, senhaPlana))
    }

    return usuario
  }

  getEmail(): Email { return this.props.email }
  getSenhaHash(): string { return this.props.senhaHash }
  getRole() { return this.props.role }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

}