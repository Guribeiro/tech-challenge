import { Injectable } from '@nestjs/common'
import { Email } from '@/shared/domain/value-objects/email.js'

import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'

import { Either, left, right } from '@/core/either.js'
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { DomainError } from '@/core/errors/domain-errors/domain-error.js'

export type EditarClienteInput = {
  id: string
  nome?: string
  email?: string
  telefone?: string
  tipo?: 'PF' | 'PJ'
}

// 1. Incluímos DomainError para cobrir ArgumentoInvalidoError lançados pelos Value Objects
type Errors =
  | RecursoNaoEncontradoError
  | EmailJaCadastradoError
  | DomainError

export type EditarClienteOutput = Either<
  Errors,
  {
    cliente: Cliente
  }
>

@Injectable()
export class EditarClienteUseCase {
  constructor(private clienteRepository: ClienteRepository) { }

  public async execute(input: EditarClienteInput): Promise<EditarClienteOutput> {
    const cliente = await this.clienteRepository.findById(input.id)

    if (!cliente) {
      return left(new RecursoNaoEncontradoError('Cliente'))
    }

    if (input.email && input.email !== cliente.getEmail().getValor()) {
      const clienteComMesmoEmail = await this.clienteRepository.findByEmail(input.email)
      if (clienteComMesmoEmail && !clienteComMesmoEmail.getId().equals(cliente.getId())) {
        return left(new EmailJaCadastradoError())
      }
    }

    try {
      let email = cliente.getEmail()
      if (input.email && input.email !== cliente.getEmail().getValor()) {
        email = Email.criar(input.email)
      }

      let nome = cliente.getNome()
      if (input.nome) {
        nome = NomeCompleto.criar(input.nome)
      }

      let telefone = cliente.getTelefone()
      if (input.telefone) {
        telefone = Telefone.criar(input.telefone)
      }

      cliente.atualizar({
        nome,
        email,
        telefone,
        tipo: input.tipo
      })

      await this.clienteRepository.save(cliente)

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