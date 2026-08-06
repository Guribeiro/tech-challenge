import { Notificacao } from "../entities/notificacao.js"

export abstract class NotificacaosRepository {
  abstract findById(id: string): Promise<Notificacao | null>
  abstract findByDestinatarioId(destinatarioId: string): Promise<Notificacao | null>
  abstract create(notificacao: Notificacao): Promise<void>
  abstract save(notificacao: Notificacao): Promise<void>
}