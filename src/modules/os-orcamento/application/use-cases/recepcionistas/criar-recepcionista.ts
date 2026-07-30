import { Either, left, right } from '@/core/either.js';
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js';
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js';
import { Recepcionista } from '@/modules/os-orcamento/domain/entities/recepcionista.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js';
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js';
import { RecepcionistaRepository } from '@/modules/os-orcamento/domain/repositories/recepcionista-repository.js';
import { Email } from '@/shared/domain/value-objects/email.js';
import { Injectable } from '@nestjs/common'

interface CriarRecepcionistaUseCaseInput {
  nome: string
  cpf: string
  email: string
}

type Errors = EmailJaCadastradoError | CpfJaCadastradoError

type CriarRecepcionistaUseCaseOutput = Either<
  Errors,
  {
    recepcionista: Recepcionista
  }
>

@Injectable()
export class CriarRecepcionistaUseCase {
  constructor(
    private recepcionistaRepository: RecepcionistaRepository
  ) { }

  async execute({
    nome,
    cpf,
    email,
  }: CriarRecepcionistaUseCaseInput): Promise<CriarRecepcionistaUseCaseOutput> {

    const mecanicoComMesmoEmail = await this.recepcionistaRepository.findByEmail(email)

    if (mecanicoComMesmoEmail) {
      return left(new EmailJaCadastradoError())
    }

    const mecanicoComMesmoCpf = await this.recepcionistaRepository.findByCpf(cpf)

    if (mecanicoComMesmoCpf) {
      return left(new CpfJaCadastradoError())
    }

    const recepcionista = Recepcionista.criar({
      nome: NomeCompleto.criar(nome),
      cpf: Cpf.criar(cpf),
      email: Email.criar(email),
    })

    await this.recepcionistaRepository.create(recepcionista)

    return right({
      recepcionista
    })
  }
}