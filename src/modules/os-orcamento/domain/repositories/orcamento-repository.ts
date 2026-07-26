import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"

export abstract class OrcamentoRepository {
  abstract findById(id: string): Promise<Orcamento | null>
  abstract findByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null>
  abstract create(orcamento: Orcamento): Promise<void>
  abstract save(orcamento: Orcamento): Promise<void>
}