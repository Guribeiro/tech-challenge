import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'

export interface ServicoRepository {
  create(servico: Servico): Promise<void>
  save(servico: Servico): Promise<void>
  findById(id: string): Promise<Servico | null>
  delete(id: string): Promise<void>
}