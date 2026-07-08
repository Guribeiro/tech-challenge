import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/modules/os-orcamento/domain/entities/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'

export type CriarClientInput = {
  id: string
  nome: string
  email: string
  telefone: string
  tipo: 'PF' | 'PJ'
}

export type CriarClientOutput = {
  cliente: Cliente
}

export class CriarCliente {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute(input: CriarClientInput): Promise<CriarClientOutput> {
    const cliente = Cliente.criar({
      nome: NomeCompleto.criar(input.nome),
      email: Email.criar(input.email),
      tipo: input.tipo,
      telefone: Telefone.criar(input.telefone),
    })

    await this.clienteRepository.create(cliente)

    return {
      cliente
    }
  }
}
