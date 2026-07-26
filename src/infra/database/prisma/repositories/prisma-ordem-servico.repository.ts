import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { BuscarFilaTrabalhoParams, BuscarFilaTrabalhoResultado, OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { PrismaOrdemServicoMapper } from "../mappers/prisma-ordem-servico-mapper.js";
import { PrismaOrdemServicoServicoMapper } from "../mappers/prisma-os-servico-mapper.js";
import { PrismaOrdemServicoComponenteMapper } from "../mappers/prisma-os-componente-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js";
import { Prisma } from "@/generated/prisma/client.js";

@Injectable()
export class PrismaOrdemServicoRepository implements OrdemServicoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(ordem: OrdemServico): Promise<void> {
    const data = PrismaOrdemServicoMapper.toPrisma(ordem)
    await this.prisma.ordemServico.create({ data })
    DomainEvents.dispatchEventsForAggregate(ordem)
  }

  public async findById(id: string): Promise<OrdemServico | null> {
    const raw = await this.prisma.ordemServico.findUnique({
      where: {
        id
      },
      include: {
        componentes: true,
        servicos: true
      }
    })

    if (!raw) return null

    return PrismaOrdemServicoMapper.toDomain(raw)
  }

  public async save(ordem: OrdemServico): Promise<void> {
    const { componentes: _, servicos: __, ...data } = PrismaOrdemServicoMapper.toPrisma(ordem)
    const ordemServicoId = ordem.getId().toValue()

    const servicosList = ordem.getServicos()
    const novosServicos = servicosList.getNewItems().map((item) => ({
      ...PrismaOrdemServicoServicoMapper.toPrisma(item),
      ordemServicoId,
    }))
    const servicosRemovidos = servicosList.getRemovedItems()

    const componentesList = ordem.getComponentes()
    const novosComponentes = componentesList.getNewItems().map((item) => ({
      ...PrismaOrdemServicoComponenteMapper.toPrisma(item),
      ordemServicoId,
    }))
    const componentesRemovidos = componentesList.getRemovedItems()

    await this.prisma.$transaction([
      this.prisma.ordemServico.update({
        where: { id: data.id },
        data,
      }),

      ...(servicosRemovidos.length > 0
        ? [
          this.prisma.ordemServicoServico.deleteMany({
            where: {
              id: {
                in: servicosRemovidos.map((item) => item.getId().toValue()),
              },
            },
          }),
        ]
        : []),

      ...(novosServicos.length > 0
        ? [
          this.prisma.ordemServicoServico.createMany({
            data: novosServicos,
          }),
        ]
        : []),

      ...(componentesRemovidos.length > 0
        ? [
          this.prisma.ordemServicoComponente.deleteMany({
            where: {
              id: {
                in: componentesRemovidos.map((item) => item.getId().toValue()),
              },
            },
          }),
        ]
        : []),

      ...(novosComponentes.length > 0
        ? [
          this.prisma.ordemServicoComponente.createMany({
            data: novosComponentes,
          }),
        ]
        : []),
    ])

    DomainEvents.dispatchEventsForAggregate(ordem)
    ordem.clearEvents()
  }

  public async listServiceQueue({
    pagina,
    limite,
    status = 'RECEBIDA'
  }: BuscarFilaTrabalhoParams): Promise<BuscarFilaTrabalhoResultado> {
    const where: Prisma.OrdemServicoWhereInput = {}

    if (status) {
      where.status = status
    }

    const [raw, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        include: {
          componentes: true,
          servicos: true,
        },
        orderBy: {
          prioridadePeso: "desc",
        },
      }),
      this.prisma.ordemServico.count({ where })
    ]);

    return {
      ordensServicos: raw.map(PrismaOrdemServicoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

  public async findManyReadyToInitialize(
    mecanicoId?: string,
  ): Promise<OrdemServico[]> {
    const raw = await this.prisma.ordemServico.findMany({
      where: {
        status: "PRONTA_PARA_INICIAR",
        ...(mecanicoId && { mecanicoId }),
      },
      include: {
        componentes: true,
        servicos: true,
      },
      orderBy: {
        prioridadePeso: "desc",
      },
    });

    return raw.map(PrismaOrdemServicoMapper.toDomain);
  }


}