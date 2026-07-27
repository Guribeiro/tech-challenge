import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events.js'
import { Fatura } from '@/modules/faturamento/domain/entities/fatura.js'
import { FaturaRepository } from '@/modules/faturamento/domain/repositories/faturas-repository.js'
import { PrismaService } from '../prisma.service.js'
import { PrismaFaturaMapper } from '../mappers/prisma-fatura-mapper.js'

@Injectable()
export class PrismaFaturaRepository implements FaturaRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(fatura: Fatura): Promise<void> {
    const data = PrismaFaturaMapper.toPrisma(fatura)

    await this.prisma.fatura.create({
      data,
    })

    DomainEvents.dispatchEventsForAggregate(fatura)
  }

  async save(fatura: Fatura): Promise<void> {
    const data = PrismaFaturaMapper.toPrisma(fatura)

    await this.prisma.fatura.update({
      where: {
        id: data.id,
      },
      data: {
        status: data.status,
        valorTotal: data.valorTotal,
        pagaEm: data.pagaEm,
      },
    })

    // Dispara os eventos acumulados (ex: FaturaPagaEvent)
    DomainEvents.dispatchEventsForAggregate(fatura)
  }

  async findById(id: string): Promise<Fatura | null> {
    const fatura = await this.prisma.fatura.findUnique({
      where: {
        id,
      },
    })

    if (!fatura) {
      return null
    }

    return PrismaFaturaMapper.toDomain(fatura)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fatura.delete({
      where: {
        id,
      },
    })
  }
}