import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'

export type EditarClienteInput = {
  id: string
  nome: string
  email: string
  telefone: string
  tipo: 'PF' | 'PJ'
}

export type EditarClienteOutput = {
  cliente: Cliente
}

@Injectable()
export class EditarClienteUseCase {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute(input: EditarClienteInput): Promise<EditarClienteOutput> {
    const cliente = await this.clienteRepository.findById(input.id)

    if (!cliente) {
      throw new Error('Cliente não encontrado')
    }

    let novoEmail = cliente.getEmail()

    if (input.email && input.email !== cliente.getEmail().getValor()) {
      const clienteComMesmoEmail = await this.clienteRepository.findByEmail(input.email)

      if (clienteComMesmoEmail && !clienteComMesmoEmail.getId().equals(cliente.getId())) {
        throw new Error('Email já em uso')
      }

      novoEmail = Email.criar(input.email)
    }

    cliente.atualizar({
      nome: NomeCompleto.criar(input.nome) ?? cliente.getNome().getValor(),
      cpf: cliente.getCpf(),
      email: novoEmail,
      telefone: Telefone.criar(input.telefone) ?? cliente.getTelefone(),
      tipo: input.tipo ?? cliente.getTipo()
    })

    await this.clienteRepository.save(cliente)

    return {
      cliente
    }
  }
}
