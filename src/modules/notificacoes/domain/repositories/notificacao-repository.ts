import { PaginationParams, PaginationResult } from "@/core/repositories/pagination-params.js"
import { Notificacao } from "../entities/notificacao.js"

export type NotificacaoQueryStatus = 'lidas' | 'nao_lidas' | 'todos'

export type BuscarNotificacoesParams = PaginationParams & {
  destinatarioId: string
  status?: NotificacaoQueryStatus
}

export type BuscarNotificacoesResultado = PaginationResult & {
  notificacoes: Notificacao[]
}


export abstract class NotificacaoRepository {
  abstract findById(id: string): Promise<Notificacao | null>
  abstract findByDestinatarioId(destinatarioId: string): Promise<Notificacao | null>
  abstract create(notificacao: Notificacao): Promise<void>
  abstract save(notificacao: Notificacao): Promise<void>
  abstract findMany(params: BuscarNotificacoesParams): Promise<BuscarNotificacoesResultado>
}