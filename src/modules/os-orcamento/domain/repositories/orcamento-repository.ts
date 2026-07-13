import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"

export interface OrcamentoRepository {
  findById(id: string): Promise<Orcamento | null>
  findByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null>
  create(orcamento: Orcamento): Promise<void>
  save(orcamento: Orcamento): Promise<void>
}