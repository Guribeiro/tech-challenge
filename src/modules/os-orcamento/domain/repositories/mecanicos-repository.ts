import { Mecanico } from '@/modules/os-orcamento/domain/entities/mecanico.js'

export interface MecanicoRepository {
  create(mecanico: Mecanico): Promise<void>
  save(mecanico: Mecanico): Promise<void>
  findById(id: string): Promise<Mecanico | null>
  delete(id: string): Promise<void>
}