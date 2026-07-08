import { Cliente } from "@/domain/entities/cliente.js"
import { Email } from "@/domain/entities/value-objects/email.js"
import { Telefone } from "@/domain/entities/value-objects/telefone.js"
import { NomeCompleto } from "@/domain/entities/value-objects/nome-completo.js"

export type CriarClientInput = {
  id: string
  nome: string
  email: string
  telefone: string
}

export class CriarCliente {
  public executar(input: CriarClientInput): Record<string, unknown> {
    const cliente = Cliente.criar({
      nome: NomeCompleto.criar(input.nome),
      email: Email.criar(input.email),
      telefone: Telefone.criar(input.telefone)
    })

    return cliente.toJSON()
  }
}
