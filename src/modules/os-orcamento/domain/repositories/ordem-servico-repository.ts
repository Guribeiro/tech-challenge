import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'

export abstract class OrdemServicoRepository {
  abstract create(ordem: OrdemServico): Promise<void>
  abstract save(ordem: OrdemServico): Promise<void>
  abstract findById(id: string): Promise<OrdemServico | null>
  abstract listServiceQueue(): Promise<OrdemServico[]>
  abstract findManyReadyToInitialize(mecanicoId?: string): Promise<OrdemServico[]>
}