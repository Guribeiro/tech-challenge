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

interface CriarMecanicoUseCaseOutput {
  mecanico: Mecanico
}

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
      throw new Error('este email já está cadastrado')
    }

    const mecanicoComMesmoCpf = await this.mecanicoRepository.findByCpf(cpf)

    if (mecanicoComMesmoCpf) {
      throw new Error('este cpf já está cadastrado')
    }

    const mecanico = Mecanico.criar({
      nome: NomeCompleto.criar(nome),
      cpf: Cpf.criar(cpf),
      email: Email.criar(email),
      especialidade,
    })

    await this.mecanicoRepository.create(mecanico)

    return {
      mecanico
    }
  }
}