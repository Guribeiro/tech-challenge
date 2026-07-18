import { AggregateRoot } from "@/core/entities/aggregate-root.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Email } from "@/shared/domain/value-objects/email.js"
import { UsuarioCriadoEvent } from "../events/usuario-criado-event.js"

interface UsuarioProps {
  email: Email
  senhaHash: string
  role: 'MECANICO' | 'RECEPCAO' | 'ADMIN' | 'CLIENTE'
}

export class Usuario extends AggregateRoot<UsuarioProps> {
  static create(props: UsuarioProps, id?: UniqueEntityID, senhaPlana?: string): Usuario {

    const usuario = new Usuario(props, id)

    if (senhaPlana) {
      usuario.addDomainEvent(new UsuarioCriadoEvent(usuario, senhaPlana))
    }

    return usuario
  }

  getEmail() { return this.props.email }
  getSenhaHash() { return this.props.senhaHash }
  getRole() { return this.props.role }
}