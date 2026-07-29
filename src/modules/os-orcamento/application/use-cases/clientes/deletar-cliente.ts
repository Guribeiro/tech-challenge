import { Either, left, right } from '@/core/either.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'

export type DeletarClienteInput = {
  id: string
}

type Errors = RecursoNaoEncontradoError | EmailJaCadastradoError

export type DeletarClienteOutput = Either<
  Errors,
  {
    cliente: Cliente
  }
>

@Injectable()
export class DeletarClienteUseCase {
  constructor(private clienteRepository: ClienteRepository) { }
  public async execute({ id }: DeletarClienteInput): Promise<DeletarClienteOutput> {
    const cliente = await this.clienteRepository.findById(id)

    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    cliente.deletar()

    await this.clienteRepository.save(cliente)

    return right({
      cliente
    })
  }
}
