import { Usuario } from "../entities/usuario.js"

export abstract class UsuariosRepository {
  abstract findByEmail(email: string): Promise<Usuario | null>
  abstract create(usuario: Usuario): Promise<void>
}