import { Injectable } from "@nestjs/common";
import { RecepcionistaRepository } from "@/modules/os-orcamento/domain/repositories/recepcionista-repository.js"
import { Recepcionista } from "@/modules/os-orcamento/domain/entities/recepcionista.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaRecepcionistaMapper } from "../mappers/prisma-recepcionista-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js"

@Injectable()
export class PrismaRecepcionistaRepository implements RecepcionistaRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(recepcionista: Recepcionista): Promise<void> {
    const data = PrismaRecepcionistaMapper.toPrisma(recepcionista)
    await this.prisma.recepcionista.create({ data })

    await DomainEvents.dispatchEventsForAggregate(recepcionista)
  }


  public async findById(id: string): Promise<Recepcionista | null> {
    const raw = await this.prisma.recepcionista.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaRecepcionistaMapper.toDomain(raw)
  }

  public async findByEmail(email: string): Promise<Recepcionista | null> {
    const raw = await this.prisma.recepcionista.findUnique({
      where: {
        email
      }
    })

    if (!raw) return null

    return PrismaRecepcionistaMapper.toDomain(raw)
  }

  public async findByCpf(cpf: string): Promise<Recepcionista | null> {
    const raw = await this.prisma.recepcionista.findUnique({
      where: {
        cpf
      }
    })

    if (!raw) return null

    return PrismaRecepcionistaMapper.toDomain(raw)
  }

  public async save(recepcionista: Recepcionista): Promise<void> {
    const data = PrismaRecepcionistaMapper.toPrisma(recepcionista);

    await this.prisma.recepcionista.update({
      where: { id: data.id },
      data,
    });

    await DomainEvents.dispatchEventsForAggregate(recepcionista)
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.recepcionista.delete({ where: { id } })
  }

}