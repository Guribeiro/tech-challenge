import { Usuario } from "../entities/usuario.js"

export abstract class UsuariosRepository {
  abstract findById(id: string): Promise<Usuario | null>
  abstract findByEmail(email: string): Promise<Usuario | null>
  abstract create(usuario: Usuario): Promise<void>
}