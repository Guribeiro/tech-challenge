import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either.js'
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { DomainError } from '@/core/errors/domain-errors/domain-error.js'
import { CpfCnpj } from '@/modules/os-orcamento/domain/entities/value-objects/cpf-cnpj'

export type CriarClienteInput = {
  nome: string
  email: string
  documento: string
  telefone: string
  tipo: 'PF' | 'PJ'
}

type Errors = EmailJaCadastradoError | CpfJaCadastradoError

export type CriarClienteOutput = Either<
  Errors,
  {
    cliente: Cliente
  }
>

@Injectable()
export class CriarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) { }
  public async execute(input: CriarClienteInput): Promise<CriarClienteOutput> {

    const clienteComMesmoEmail = await this.clienteRepository.findByEmail(input.email)

    if (clienteComMesmoEmail) {
      return left(new EmailJaCadastradoError())
    }

    const clienteComMesmoCpf = await this.clienteRepository.findByDocumento(input.documento)

    if (clienteComMesmoCpf) {
      return left(new CpfJaCadastradoError())
    }

    try {
      const cliente = Cliente.criar({
        nome: NomeCompleto.criar(input.nome),
        email: Email.criar(input.email),
        documento: CpfCnpj.criar(input.documento),
        tipo: input.tipo,
        telefone: Telefone.criar(input.telefone),
      })

      await this.clienteRepository.create(cliente)

      return right({
        cliente
      })
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }
      throw error
    }
  }
}
