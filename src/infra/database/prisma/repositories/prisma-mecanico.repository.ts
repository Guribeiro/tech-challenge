import { Injectable } from "@nestjs/common";
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js";
import { Mecanico } from "@/modules/os-orcamento/domain/entities/mecanico.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaMecanicoMapper } from "../mappers/prisma-mecanico-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js"

@Injectable()
export class PrismaMecanicoRepository implements MecanicoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(mecanico: Mecanico): Promise<void> {
    const data = PrismaMecanicoMapper.toPrisma(mecanico)
    await this.prisma.mecanico.create({ data })

    await DomainEvents.dispatchEventsForAggregate(mecanico)
  }


  public async findById(id: string): Promise<Mecanico | null> {
    const raw = await this.prisma.mecanico.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaMecanicoMapper.toDomain(raw)
  }

  public async findByEmail(email: string): Promise<Mecanico | null> {
    const raw = await this.prisma.mecanico.findUnique({
      where: {
        email
      }
    })

    if (!raw) return null

    return PrismaMecanicoMapper.toDomain(raw)
  }

  public async findByCpf(cpf: string): Promise<Mecanico | null> {
    const raw = await this.prisma.mecanico.findUnique({
      where: {
        cpf
      }
    })

    if (!raw) return null

    return PrismaMecanicoMapper.toDomain(raw)
  }

  public async save(mecanico: Mecanico): Promise<void> {
    const data = PrismaMecanicoMapper.toPrisma(mecanico);

    await this.prisma.mecanico.update({
      where: { id: data.id },
      data,
    });

    await DomainEvents.dispatchEventsForAggregate(mecanico)
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.mecanico.delete({ where: { id } })
  }

}