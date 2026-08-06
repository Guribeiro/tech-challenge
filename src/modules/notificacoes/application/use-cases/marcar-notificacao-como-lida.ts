import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either.js'
import { NotificacaoRepository } from '../../domain/repositories/notificacao-repository.js'
import { Notificacao } from '../../domain/entities/notificacao.js'
import { RecursoNaoEncontradoError } from '@/core/errors/recurso-nao-encontrado.js'
import { AcessoNegadoError } from '@/core/errors/acesso-negado-error.js'

export interface MarcarNotificacaoComoLidaInput {
  notificacaoId: string
  destinatarioId: string
}

export type MarcarNotificacaoComoLidaOutput = Either<
  RecursoNaoEncontradoError | AcessoNegadoError,
  {
    notificacao: Notificacao
  }
>

@Injectable()
export class MarcarNotificacaoComoLidaUseCase {
  constructor(private readonly notificacoesRepository: NotificacaoRepository) { }

  async execute({
    notificacaoId,
    destinatarioId,
  }: MarcarNotificacaoComoLidaInput): Promise<MarcarNotificacaoComoLidaOutput> {
    const notificacao = await this.notificacoesRepository.findById(notificacaoId)

    if (!notificacao) {
      return left(new RecursoNaoEncontradoError())
    }

    if (notificacao.getDestinatarioId().toValue() !== destinatarioId) {
      return left(new AcessoNegadoError())
    }

    notificacao.marcarComoLida()

    await this.notificacoesRepository.save(notificacao)

    return right({
      notificacao,
    })
  }
}