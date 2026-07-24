import { Servico, CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'
import { Injectable } from '@nestjs/common'

export type CriarServicoInput = {
  nome: string
  categoria: CategoriaServico
  descricao?: string
  valorReferencia: number
}

export type CriarServicoOutput = {
  servico: Servico
}

@Injectable()
export class CriarServicoUseCase {
  constructor(
    private readonly servicosRepository: ServicoRepository
  ) { }
  public async execute(input: CriarServicoInput): Promise<CriarServicoOutput> {
    const servico = Servico.criar({
      nome: input.nome,
      descricao: input.descricao,
      categoria: input.categoria,
      valorReferencia: input.valorReferencia,
    })

    await this.servicosRepository.create(servico)

    return {
      servico
    }
  }
}
