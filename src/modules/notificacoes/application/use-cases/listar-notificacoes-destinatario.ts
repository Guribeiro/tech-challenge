import { Either, right } from '@/core/either.js'
import {
  BuscarNotificacoesParams,
  BuscarNotificacoesResultado,
  NotificacaoRepository
} from "../../domain/repositories/notificacao-repository.js"
import { Injectable } from '@nestjs/common'

export type ListarNotificacoesInput = Partial<BuscarNotificacoesParams> & {
  destinatarioId: string
}

export type ListarNotificacoesOutput = Either<never, BuscarNotificacoesResultado>

@Injectable()
export class ListarNotificacoesDestinatarioUseCase {
  constructor(private readonly notificacaoRepository: NotificacaoRepository) { }
  public async execute(input: ListarNotificacoesInput): Promise<ListarNotificacoesOutput> {
    const pagina = input.pagina ?? 1
    const limite = input.limite ?? 10
    const status = input.status ?? 'nao_lidas'

    const { notificacoes, total } = await this.notificacaoRepository.findMany({
      destinatarioId: input.destinatarioId,
      limite,
      pagina,
      status
    })
    return right({
      notificacoes,
      total,
      pagina,
      limite,
    })
  }
}