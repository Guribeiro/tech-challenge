import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js";
import { PrismaService } from "../prisma.service.js";
import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js";
import { DomainEvents } from "@/core/events/domain-events.js";
import { PrismaOrcamentoMapper } from "../mappers/prisma-orcamento-mapper.js";
import { PrismaOrcamentoServicoMapper } from "../mappers/prisma-orcamento-servico-mapper.js";
import { PrismaOrcamentoComponenteMapper } from "../mappers/prisma-orcamento-componente-mapper.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaOrcamentoRepository implements OrcamentoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(orcamento: Orcamento): Promise<void> {
    const data = PrismaOrcamentoMapper.toPrisma(orcamento)
    await this.prisma.orcamento.create({ data })
    await DomainEvents.dispatchEventsForAggregate(orcamento)
  }

  public async findById(id: string): Promise<Orcamento | null> {
    const raw = await this.prisma.orcamento.findUnique({
      where: {
        id
      },
      include: {
        componentes: true,
        servicos: true
      }
    })

    if (!raw) return null

    return PrismaOrcamentoMapper.toDomain(raw)
  }

  public async findByOrdemServicoId(ordemServicoId: string): Promise<Orcamento | null> {
    const raw = await this.prisma.orcamento.findFirst({
      where: {
        ordemServicoId
      },
      include: {
        componentes: true,
        servicos: true
      }
    })

    if (!raw) return null

    return PrismaOrcamentoMapper.toDomain(raw)
  }

  public async save(orcamento: Orcamento): Promise<void> {
    const { componentes: _, servicos: __, ...data } = PrismaOrcamentoMapper.toPrisma(orcamento)
    const orcamentoId = orcamento.getId().toValue()

    const servicosList = orcamento.getServicos()
    const novosServicos = servicosList.getNewItems().map((item) => ({
      ...PrismaOrcamentoServicoMapper.toPrisma(item),
      orcamentoId,
    }))
    const servicosRemovidos = servicosList.getRemovedItems()

    const componentesList = orcamento.getComponentes()
    const novosComponentes = componentesList.getNewItems().map((item) => ({
      ...PrismaOrcamentoComponenteMapper.toPrisma(item),
      orcamentoId,
    }))
    const componentesRemovidos = componentesList.getRemovedItems()

    await this.prisma.$transaction([
      this.prisma.orcamento.update({
        where: { id: data.id },
        data,
      }),

      // B) Remoções cirúrgicas de Serviços (DELETE por ID)
      ...(servicosRemovidos.length > 0
        ? [
          this.prisma.orcamentoServico.deleteMany({
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
          this.prisma.orcamentoServico.createMany({
            data: novosServicos,
          }),
        ]
        : []),

      ...(componentesRemovidos.length > 0
        ? [
          this.prisma.orcamentoComponente.deleteMany({
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
          this.prisma.orcamentoComponente.createMany({
            data: novosComponentes,
          }),
        ]
        : []),
    ])

    await DomainEvents.dispatchEventsForAggregate(orcamento)
    orcamento.clearEvents()
  }



}