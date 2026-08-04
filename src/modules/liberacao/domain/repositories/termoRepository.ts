import { TermoLiberacao } from "@/modules/liberacao/domain/entities/termo-liberacao.js"

export abstract class TermoLiberacaoRepository {
  abstract findById(id: string): Promise<TermoLiberacao | null>
  abstract findByOrdemServicoId(ordemServicoId: string): Promise<TermoLiberacao | null>
  abstract create(termo: TermoLiberacao): Promise<void>
  abstract save(termo: TermoLiberacao): Promise<void>
}