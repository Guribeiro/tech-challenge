import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'

export interface OrdemServicoRepository {
  create(ordem: OrdemServico): Promise<void>
  save(ordem: OrdemServico): Promise<void>
  findById(id: string): Promise<OrdemServico | null>
  listServiceQueue(): Promise<OrdemServico[]>
}