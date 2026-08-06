import { Injectable } from "@nestjs/common";
import { NotificacaosRepository } from "@/modules/notificacoes/domain/repositories/notificacao-repository.js";
import { Notificacao } from "@/modules/notificacoes/domain/entities/notificacao.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaNotificacaoMapper } from "../mappers/prisma-notificacao-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js"

@Injectable()
export class PrismaNotificacaosRepository implements NotificacaosRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(notificacao: Notificacao): Promise<void> {
    const data = PrismaNotificacaoMapper.toPrisma(notificacao)
    await this.prisma.notificacao.create({ data })

    await DomainEvents.dispatchEventsForAggregate(notificacao)
  }


  public async findById(id: string): Promise<Notificacao | null> {
    const raw = await this.prisma.notificacao.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaNotificacaoMapper.toDomain(raw)
  }

  public async findByDestinatarioId(destinatarioId: string): Promise<Notificacao | null> {
    const raw = await this.prisma.notificacao.findFirst({
      where: {
        destinatarioId
      }
    })

    if (!raw) return null

    return PrismaNotificacaoMapper.toDomain(raw)
  }

  public async save(notificacao: Notificacao): Promise<void> {
    const data = PrismaNotificacaoMapper.toPrisma(notificacao);

    await this.prisma.notificacao.update({
      where: { id: data.id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.notificacao.delete({ where: { id } })
  }

}