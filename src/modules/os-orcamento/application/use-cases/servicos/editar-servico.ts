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

type EditarServicoOutput = {
  servico: Servico
}

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
      throw new Error('Servico não encontrado')
    }

    servico.atualizar({
      nome,
      categoria,
      descricao,
      valorReferencia
    })

    await this.servicoRepository.save(servico)

    return {
      servico
    }
  }
}