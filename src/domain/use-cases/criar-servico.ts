import { Servico } from '../entities/servico.js'

export type CriarServicoInput = {
  nome: string
  descricao?: string
  valorReferencia?: number
}

export class CriarServico {
  public executar(input: CriarServicoInput): Record<string, unknown> {
    const servico = Servico.criar({
      nome: input.nome,
      descricao: input.descricao,
      valorReferencia: input.valorReferencia,
    })

    return servico.toJSON()
  }
}
