// src/infra/database/prisma/mappers/prisma-termo-liberacao.mapper.ts
import { TermoLiberacao as PrismaTermoLiberacao } from '@/generated/prisma/client.js'
import { TermoLiberacao } from '@/modules/liberacao/domain/entities/termo-liberacao.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

export class PrismaTermoLiberacaoMapper {
  // Transforma o modelo do Prisma (Banco) para a Entidade de Domínio
  static toDomain(raw: PrismaTermoLiberacao): TermoLiberacao {
    return TermoLiberacao.criar(
      {
        ordemServicoId: new UniqueEntityID(raw.ordemServicoId),
        placaVeiculo: raw.placaVeiculo,
        motivo: raw.motivo, // Certifique-se de que o Enum do Prisma bate com a union do tipo do Domínio
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(termoLiberacao: TermoLiberacao): PrismaTermoLiberacao {
    return {
      id: termoLiberacao.getId().toValue(),
      ordemServicoId: termoLiberacao.getOrdemServicoId().toValue(),
      placaVeiculo: termoLiberacao.getPlacaVeiculo(),
      motivo: termoLiberacao.getMotivo(),
      conteudo: termoLiberacao.getConteudo(),
      emitidoEm: termoLiberacao.getEmitidoEm(),
    }
  }
}