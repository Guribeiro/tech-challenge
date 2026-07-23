import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'

export type DeletarClienteInput = {
  id: string
}

export type DeletarClienteOutput = {
  cliente: Cliente
}

@Injectable()
export class DeletarClienteUseCase {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute({ id }: DeletarClienteInput): Promise<DeletarClienteOutput> {
    const cliente = await this.clienteRepository.findById(id)

    if (!cliente) {
      throw new Error('Cliente não encontrado')
    }

    cliente.deletar()

    await this.clienteRepository.save(cliente)

    return {
      cliente
    }
  }
}
