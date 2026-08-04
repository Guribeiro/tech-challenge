import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Orcamento, OrcamentoProps } from '@/modules/os-orcamento/domain/entities/orcamento.js'

export function makeOrcamento(
  override: Partial<OrcamentoProps> = {},
  id?: UniqueEntityID,
): Orcamento {
  const orcamento = Orcamento.criar(
    {
      ordemServicoId: new UniqueEntityID(),
      clienteId: new UniqueEntityID(),
      ...override,
    },
    id,
  )

  return orcamento
}