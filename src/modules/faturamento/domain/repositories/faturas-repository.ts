import { Fatura } from '@/modules/faturamento/domain/entities/fatura.js'

export abstract class FaturaRepository {
  abstract create(fatura: Fatura): Promise<void>
  abstract save(fatura: Fatura): Promise<void>
  abstract findById(id: string): Promise<Fatura | null>
  abstract delete(id: string): Promise<void>
}