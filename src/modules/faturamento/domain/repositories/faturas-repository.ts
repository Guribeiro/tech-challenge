import { Fatura } from '@/modules/faturamento/domain/entities/fatura.js'

export interface FaturaRepository {
  create(fatura: Fatura): Promise<void>
  save(fatura: Fatura): Promise<void>
  findById(id: string): Promise<Fatura | null>
  delete(id: string): Promise<void>
}