import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { OrdemServico } from '@/domain/entities/ordem-servico.js'
import { Servico } from '@/domain/entities/servico.js'

export type CriarOrdemServicoInput = {
  clienteId: string
  veiculoId: string
  descricao: string
  servicos?: Array<{
    id?: string
    nome?: string
    descricao?: string
    valorReferencia?: number
    observacao?: string
  }>
  itens?: Array<{
    tipo: 'PECA' | 'INSUMO'
    descricao: string
    quantidade: number
  }>
}

export class CriaOrdemServico {
  public execute(input: CriarOrdemServicoInput): OrdemServico {
    const servicos = input.servicos?.map((servicoInput) => ({
      servico: Servico.criar({
        id: servicoInput.id,
        nome: servicoInput.nome ?? servicoInput.descricao ?? 'Serviço sem nome',
        descricao: servicoInput.descricao,
        valorReferencia: servicoInput.valorReferencia,
      }),
      observacao: servicoInput.observacao,
    }))

    const ordemServico = OrdemServico.criar({
      clienteId: new UniqueEntityID(input.clienteId),
      veiculoId: new UniqueEntityID(input.veiculoId),
      descricao: input.descricao,
      servicos,
      itens: input.itens,
    })

    return ordemServico
  }
}
