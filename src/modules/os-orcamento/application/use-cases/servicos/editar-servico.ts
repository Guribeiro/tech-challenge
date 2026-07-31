import { Either, left, right } from "@/core/either.js";
import { DomainError } from "@/core/errors/domain-errors/domain-error.js";
import { RecursoNaoEncontradoError } from "@/core/errors/recurso-nao-encontrado.js";
import { ServicoJaCadastradoError } from "@/core/errors/servico-ja-cadastrado-error.js";
import { type CategoriaServico, Servico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";
import { Injectable } from "@nestjs/common";

export type EditarServicoInput = {
  id: string
  nome?: string
  categoria?: CategoriaServico
  descricao?: string
  valorReferencia?: number
}

type Errors = RecursoNaoEncontradoError | ServicoJaCadastradoError | DomainError

type EditarServicoOutput = Either<
  Errors,
  {
    servico: Servico
  }
>

@Injectable()
export class EditarServicoUseCase {
  constructor(
    private readonly servicoRepository: ServicoRepository
  ) { }

  public async execute({
    id,
    nome,
    categoria,
    descricao,
    valorReferencia
  }: EditarServicoInput): Promise<EditarServicoOutput> {
    const servico = await this.servicoRepository.findById(id)

    if (!servico) {
      return left(new RecursoNaoEncontradoError('Serviço'))
    }

    if (nome) {
      const servicoComMesmoNome = await this.servicoRepository.findByNome(nome)

      if (servicoComMesmoNome && servicoComMesmoNome.getId().toValue() !== id) {
        return left(new ServicoJaCadastradoError(nome))
      }
    }

    try {
      servico.atualizar({
        nome,
        categoria,
        descricao,
        valorReferencia
      })

      await this.servicoRepository.save(servico)

      return right({
        servico
      })
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }
      throw error
    }
  }
}