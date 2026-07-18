import { Usuario } from "../entities/usuario.js"

export interface UsuariosRepository {
  findByEmail(email: string): Promise<Usuario | null>
  create(usuario: Usuario): Promise<void>
}