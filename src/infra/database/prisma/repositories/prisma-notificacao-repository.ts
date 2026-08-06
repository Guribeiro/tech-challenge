import { Injectable } from "@nestjs/common";
import { BuscarNotificacoesParams, BuscarNotificacoesResultado, NotificacaoRepository } from "@/modules/notificacoes/domain/repositories/notificacao-repository.js";
import { Notificacao } from "@/modules/notificacoes/domain/entities/notificacao.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaNotificacaoMapper } from "../mappers/prisma-notificacao-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js"
import { Prisma } from "@/generated/prisma/client.js";

@Injectable()
export class PrismaNotificacaoRepository implements NotificacaoRepository {
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

  public async findMany({
    destinatarioId,
    pagina,
    limite,
    status = 'nao_lidas',
  }: BuscarNotificacoesParams): Promise<BuscarNotificacoesResultado> {
    const where: Prisma.NotificacaoWhereInput = {
      destinatarioId,
      ...(status === 'lidas' && { lidaEm: { not: null } }),
      ...(status === 'nao_lidas' && { lidaEm: null }),
    }

    // 2. Executa a busca paginada e a contagem total em paralelo
    const [rawNotificacoes, total] = await Promise.all([
      this.prisma.notificacao.findMany({
        where,
        orderBy: {
          criadaEm: 'desc',
        },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.notificacao.count({ where }),
    ])

    return {
      notificacoes: rawNotificacoes.map(PrismaNotificacaoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

}