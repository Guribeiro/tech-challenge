import { Injectable } from "@nestjs/common"
import { Notificacao } from "../../domain/entities/notificacao.js"
import { NotificacaoRepository } from "../../domain/repositories/notificacao-repository.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"

interface EnviarNotificacaoInput {
  destinatarioId: string // ID do Usuário que receberá a notificação
  titulo: string
  conteudo: string
  template: string
  contexto?: Record<string, unknown>
}

interface EnviarNotificacaoOutput {
  notificacao: Notificacao
}

@Injectable()
export class CriarNotificacaoUseCase {
  constructor(
    private readonly notificacaoRepository: NotificacaoRepository
  ) { }

  public async execute({
    destinatarioId,
    titulo,
    conteudo,
    template,
    contexto
  }: EnviarNotificacaoInput): Promise<EnviarNotificacaoOutput> {
    const notificacao = Notificacao.create({
      destinatarioId: new UniqueEntityID(destinatarioId),
      titulo,
      conteudo,
      template,
      contexto
    })

    await this.notificacaoRepository.create(notificacao)

    return {
      notificacao
    }
  }
}