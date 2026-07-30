import { Recepcionista } from '@/modules/os-orcamento/domain/entities/recepcionista.js'

export abstract class RecepcionistaRepository {
  abstract create(recepcionista: Recepcionista): Promise<void>
  abstract save(recepcionista: Recepcionista): Promise<void>
  abstract findById(id: string): Promise<Recepcionista | null>
  abstract findByEmail(email: string): Promise<Recepcionista | null>
  abstract findByCpf(cpf: string): Promise<Recepcionista | null>
  abstract delete(id: string): Promise<void>
}