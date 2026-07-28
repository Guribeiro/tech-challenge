import { Either, left, right } from '@/core/either.js';
import { CpfJaCadastradoError } from '@/core/errors/cpf-ja-cadastrado.js';
import { EmailJaCadastradoError } from '@/core/errors/email-ja-cadastrado-error.js';
import { Mecanico } from '@/modules/os-orcamento/domain/entities/mecanico.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js';
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js';
import { MecanicoRepository } from '@/modules/os-orcamento/domain/repositories/mecanicos-repository.js';
import { Email } from '@/shared/domain/value-objects/email.js';
import { Injectable } from '@nestjs/common'

interface CriarMecanicoUseCaseInput {
  nome: string
  cpf: string
  email: string
  especialidade?: string
}

type Errors = EmailJaCadastradoError | CpfJaCadastradoError

type CriarMecanicoUseCaseOutput = Either<
  Errors,
  {
    mecanico: Mecanico
  }
>

@Injectable()
export class CriarMecanicoUseCase {
  constructor(
    private mecanicoRepository: MecanicoRepository
  ) { }

  async execute({
    nome,
    cpf,
    email,
    especialidade
  }: CriarMecanicoUseCaseInput): Promise<CriarMecanicoUseCaseOutput> {

    const mecanicoComMesmoEmail = await this.mecanicoRepository.findByEmail(email)

    if (mecanicoComMesmoEmail) {
      return left(new EmailJaCadastradoError())
    }

    const mecanicoComMesmoCpf = await this.mecanicoRepository.findByCpf(cpf)

    if (mecanicoComMesmoCpf) {
      return left(new CpfJaCadastradoError())
    }

    const mecanico = Mecanico.criar({
      nome: NomeCompleto.criar(nome),
      cpf: Cpf.criar(cpf),
      email: Email.criar(email),
      especialidade,
    })

    await this.mecanicoRepository.create(mecanico)

    return right({
      mecanico
    })
  }
}