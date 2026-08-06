import { Notificacao as PrismaNotificacao, Prisma } from '@/generated/prisma/client.js'
import { Notificacao } from '@/modules/notificacoes/domain/entities/notificacao.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaNotificacaoMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaNotificacao): Notificacao {
    const contexto =
      raw.contexto && typeof raw.contexto === 'object' && !Array.isArray(raw.contexto)
        ? (raw.contexto as Record<string, unknown>)
        : undefined

    return Notificacao.create(
      {
        titulo: raw.titulo,
        conteudo: raw.conteudo,
        destinatarioId: new UniqueEntityID(raw.destinatarioId),
        contexto,
        template: raw.template ?? undefined,
        criadaEm: raw.criadaEm,
        lidaEm: raw.lidaEm ?? undefined
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(notificacao: Notificacao): Prisma.NotificacaoUncheckedCreateInput {
    const contexto = notificacao.getContexto()
    return {
      id: notificacao.getId().toValue(),
      titulo: notificacao.getTitulo(),
      conteudo: notificacao.getConteudo(),
      contexto: contexto ? (contexto as Prisma.InputJsonObject) : Prisma.DbNull,
      destinatarioId: notificacao.getDestinatarioId().toValue(),
      template: notificacao.getTemplate() ?? null,
      criadaEm: notificacao.getCriadaEm(),
      lidaEm: notificacao.getLidaEm() ?? null,
    }
  }
}