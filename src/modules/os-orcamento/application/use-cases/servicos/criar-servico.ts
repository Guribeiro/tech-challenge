import { Either, left, right } from '@/core/either.js'
import { ServicoJaCadastradoError } from '@/core/errors/index.js'
import { CategoriaServico, Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'
import { Injectable } from '@nestjs/common'

export type CriarServicoInput = {
  nome: string
  categoria: CategoriaServico
  descricao?: string
  valorReferencia: number
}

type Errors = ServicoJaCadastradoError

export type CriarServicoOutput = Either<
  Errors,
  {
    servico: Servico
  }
>

@Injectable()
export class CriarServicoUseCase {
  constructor(
    private readonly servicosRepository: ServicoRepository
  ) { }
  public async execute(input: CriarServicoInput): Promise<CriarServicoOutput> {
    const nomeNormalizado = input.nome.replace(/\0/g, '').trim()

    const servicoExistente = await this.servicosRepository.findByNome(nomeNormalizado)

    if (servicoExistente) {
      return left(new ServicoJaCadastradoError(nomeNormalizado))
    }

    const servico = Servico.criar({
      nome: input.nome,
      descricao: input.descricao,
      categoria: input.categoria,
      valorReferencia: input.valorReferencia,
    })

    await this.servicosRepository.create(servico)

    return right({
      servico
    })
  }
}
