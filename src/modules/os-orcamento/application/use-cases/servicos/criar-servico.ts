import { Servico, CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'

export type CriarServicoInput = {
  nome: string
  categoria: CategoriaServico
  descricao?: string
  valorReferencia?: number
}

export class CriarServico {
  public executar(input: CriarServicoInput): Record<string, unknown> {
    const servico = Servico.criar({
      nome: input.nome,
      descricao: input.descricao,
      categoria: input.categoria,
      valorReferencia: input.valorReferencia,
    })

    return servico.toJSON()
  }
}
