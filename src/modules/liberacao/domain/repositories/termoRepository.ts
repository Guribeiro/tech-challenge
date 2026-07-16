import { TermoLiberacao } from "@/modules/liberacao/domain/entities/termo-liberacao.js"

export interface TermoLiberacaoRepository {
  findById(id: string): Promise<TermoLiberacao | null>
  findByOrdemServicoId(ordemServicoId: string): Promise<TermoLiberacao | null>
  create(termo: TermoLiberacao): Promise<void>
  save(termo: TermoLiberacao): Promise<void>
}