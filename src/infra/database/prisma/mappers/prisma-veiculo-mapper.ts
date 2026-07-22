import { Veiculo as PrismaVeiculo } from '@/generated/prisma/client.js'
import { Veiculo } from '@/modules/os-orcamento/domain/entities/veiculo.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'

export class PrismaVeiculoMapper {
  // Transforma o modelo do Prisma (Banco) para Entidade de Domínio
  static toDomain(raw: PrismaVeiculo): Veiculo {
    return Veiculo.criar(
      {
        placa: Placa.criar(raw.placa),
        ano: raw.ano,
        marca: raw.marca,
        modelo: raw.modelo,
        combustivel: raw.combustivel ?? undefined,
        cor: raw.cor ?? undefined,
        observacoes: raw.observacoes ?? undefined,
        quilometragem: raw.quilometragem ?? undefined,
        deletadoEm: raw.deletadoEm ?? undefined,
        criadoEm: raw.criadoEm,
        atualizadoEm: raw.atualizadoEm ?? undefined,
      },
      new UniqueEntityID(raw.id)
    )
  }

  // Transforma a Entidade de Domínio para o formato do Prisma (Banco)
  static toPrisma(veiculo: Veiculo): PrismaVeiculo {
    return {
      id: veiculo.getId().toValue(),
      placa: veiculo.getPlaca().getValor(),
      ano: veiculo.getAno(),
      marca: veiculo.getMarca(),
      modelo: veiculo.getModelo(),
      combustivel: veiculo.getCombustivel() ?? null,
      cor: veiculo.getCor() ?? null,
      observacoes: veiculo.getObservacoes() ?? null,
      quilometragem: veiculo.getQuilometragem() ?? null,
      deletadoEm: veiculo.getDeletadoEm() ?? null,
      criadoEm: veiculo.getCriadoEm(),
      atualizadoEm: veiculo.getAtualizadoEm() ?? null,
    }
  }
}