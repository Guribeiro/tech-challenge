import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";
import { Injectable } from "@nestjs/common";

type ReativarServicoInput = {
  servicoId: string
}

type ReativarServicoOutput = {
  servico: Servico
}

@Injectable()
export class ReativarServicoUseCase {
  constructor(
    private readonly servicoRepository: ServicoRepository
  ) { }

  public async execute({ servicoId }: ReativarServicoInput): Promise<ReativarServicoOutput> {
    const servico = await this.servicoRepository.findById(servicoId)

    if (!servico) {
      throw new Error('Servico não encontrado')
    }

    servico.reativar()

    await this.servicoRepository.save(servico)

    return {
      servico
    }
  }
}