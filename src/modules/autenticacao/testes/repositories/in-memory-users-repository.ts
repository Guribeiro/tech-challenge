import { DomainEvents } from "@/core/events/domain-events.js"
import { Usuario } from "../../domain/entities/usuario.js"
import { UsuariosRepository } from "../../domain/repositories/usuarios-repository.js"

export class InMemoryUsuariosRepository implements UsuariosRepository {
  public items: Usuario[] = []

  async findByEmail(email: string): Promise<Usuario | null> {
    const usuario = this.items.find(item => item.getEmail().getValor() === email)
    return usuario || null
  }

  async create(usuario: Usuario): Promise<void> {
    this.items.push(usuario)

    usuario.domainEvents.forEach(event => DomainEvents.dispatch(event))
  }
}