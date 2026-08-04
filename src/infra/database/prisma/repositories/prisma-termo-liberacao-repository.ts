import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { TermoLiberacao } from '@/modules/liberacao/domain/entities/termo-liberacao.js'
import { TermoLiberacaoRepository } from '@/modules/liberacao/domain/repositories/termoRepository.js'
import { PrismaTermoLiberacaoMapper } from '../mappers/prisma-termo-liberacao-mapper.js'
import { DomainEvents } from '@/core/events/domain-events.js'

@Injectable()
export class PrismaTermoLiberacaoRepository implements TermoLiberacaoRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<TermoLiberacao | null> {
    const termo = await this.prisma.termoLiberacao.findUnique({
      where: { id },
    })

    if (!termo) {
      return null
    }

    return PrismaTermoLiberacaoMapper.toDomain(termo)
  }

  async findByOrdemServicoId(ordemServicoId: string): Promise<TermoLiberacao | null> {
    const termo = await this.prisma.termoLiberacao.findFirst({
      where: { ordemServicoId },
    })

    if (!termo) {
      return null
    }

    return PrismaTermoLiberacaoMapper.toDomain(termo)
  }

  async create(termo: TermoLiberacao): Promise<void> {
    const data = PrismaTermoLiberacaoMapper.toPrisma(termo)

    await this.prisma.termoLiberacao.create({
      data,
    })

    DomainEvents.dispatchEventsForAggregate(termo)
  }

  async save(termo: TermoLiberacao): Promise<void> {
    const data = PrismaTermoLiberacaoMapper.toPrisma(termo)

    await this.prisma.termoLiberacao.update({
      where: { id: data.id },
      data,
    })

    DomainEvents.dispatchEventsForAggregate(termo)
  }
}