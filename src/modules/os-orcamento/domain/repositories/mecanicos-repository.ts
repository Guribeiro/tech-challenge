import { Mecanico } from '@/modules/os-orcamento/domain/entities/mecanico.js'

export abstract class MecanicoRepository {
  abstract create(mecanico: Mecanico): Promise<void>
  abstract save(mecanico: Mecanico): Promise<void>
  abstract findById(id: string): Promise<Mecanico | null>
  abstract delete(id: string): Promise<void>
}