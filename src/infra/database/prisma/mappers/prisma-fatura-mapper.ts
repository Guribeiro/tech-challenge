// src/infra/database/prisma/mappers/prisma-fatura-mapper.ts
import { Fatura as PrismaFatura } from '@/generated/prisma/client.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Fatura, StatusFatura } from '@/modules/faturamento/domain/entities/fatura.js'

export class PrismaFaturaMapper {
  // Transforma o modelo do Prisma (Banco) para a Entidade de Domínio
  static toDomain(raw: PrismaFatura): Fatura {
    return Fatura.criar(
      {
        orcamentoId: new UniqueEntityID(raw.orcamentoId),
        status: raw.status as StatusFatura,
        valorTotal: raw.valorTotal,
        emitidaEm: raw.emitidaEm,
        pagaEm: raw.pagaEm ?? undefined,
      },
      new UniqueEntityID(raw.id),
    )
  }

  // Transforma a Entidade de Domínio para o formato plano do Prisma
  static toPrisma(fatura: Fatura): PrismaFatura {
    return {
      id: fatura.getId().toValue(),
      orcamentoId: fatura.getOrcamentoId().toValue(),
      status: fatura.getStatus(),
      valorTotal: fatura.getValorTotal(),
      emitidaEm: fatura.getEmitidaEm(),
      pagaEm: fatura.getPagaEm() ?? null,
    }
  }
}