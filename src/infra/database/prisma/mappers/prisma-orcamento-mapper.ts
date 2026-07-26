import {
  Prisma,
  Orcamento as PrismaOrcamento,
  OrcamentoComponente as PrismaOrcamentoComponente,
  OrcamentoServico as PrismaOrcamentoServico
} from '@/generated/prisma/client.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { PrismaOrcamentoServicoMapper } from './prisma-orcamento-servico-mapper.js'
import { PrismaOrcamentoComponenteMapper } from './prisma-orcamento-componente-mapper.js'
import { Orcamento } from '@/modules/os-orcamento/domain/entities/orcamento.js'
import { OrcamentoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/orcamento-servico-list.js'
import { OrcamentoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/orcamento-componente-list.js'

type PrismaOrcamentoComRelacoes = PrismaOrcamento & {
  servicos: PrismaOrcamentoServico[]
  componentes: PrismaOrcamentoComponente[]
}

export class PrismaOrcamentoMapper {
  static toDomain(raw: PrismaOrcamentoComRelacoes): Orcamento {

    const componentes = raw.componentes.map(
      PrismaOrcamentoComponenteMapper.toDomain,
    )

    const servicos = raw.servicos.map(
      PrismaOrcamentoServicoMapper.toDomain,
    )
    return Orcamento.criar({
      clienteId: new UniqueEntityID(raw.clienteId),
      servicos: new OrcamentoServicoList(servicos),
      componentes: new OrcamentoComponenteList(componentes),
      ordemServicoId: new UniqueEntityID(raw.ordemServicoId),
      descontoPorcentagem: raw.descontoPorcentagem,
      status: raw.status,
      versao: raw.versao,
      atualizadoEm: raw.atualizadoEm ?? undefined,
      criadoEm: raw.criadoEm,
    }, new UniqueEntityID(raw.id))
  }
  static toPrisma(orcamento: Orcamento): Prisma.OrcamentoCreateInput {
    return {
      id: orcamento.getId().toValue(),
      cliente: { connect: { id: orcamento.getClienteId().toValue() } },
      ordemServico: { connect: { id: orcamento.getOrdemServicoId().toValue() } },
      status: orcamento.getStatus(),
      versao: orcamento.getVersao(),
      descontoPorcentagem: orcamento.getDescontoPorcentagem(),
      componentes: {
        createMany: {
          data: orcamento.getComponentes().getItems().map(PrismaOrcamentoComponenteMapper.toPrisma)
        }
      },
      servicos: {
        createMany: {
          data: orcamento.getServicos().getItems().map(PrismaOrcamentoServicoMapper.toPrisma)
        }
      },
      atualizadoEm: orcamento.getAtualizadoEm() ?? null,
      criadoEm: orcamento.getCriadoEm()
    }
  }
}