import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'
import { Injectable } from '@nestjs/common'

export type CriarClienteInput = {
  nome: string
  email: string
  cpf: string
  telefone: string
  tipo: 'PF' | 'PJ'
}

export type CriarClienteOutput = {
  cliente: Cliente
}

@Injectable()
export class CriarClienteUseCase {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute(input: CriarClienteInput): Promise<CriarClienteOutput> {
    const cliente = Cliente.criar({
      nome: NomeCompleto.criar(input.nome),
      email: Email.criar(input.email),
      cpf: Cpf.criar(input.cpf),
      tipo: input.tipo,
      telefone: Telefone.criar(input.telefone),
    })

    await this.clienteRepository.create(cliente)

    return {
      cliente
    }
  }
}
