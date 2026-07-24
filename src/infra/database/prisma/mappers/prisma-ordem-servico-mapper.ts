import {
  Prisma,
  OrdemServico as PrismaOrdemServico,
  OrdemServicoComponente as PrismaOrdemServicoComponente,
  OrdemServicoServico as PrismaOrdemServicoServico
} from '@/generated/prisma/client.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { PrismaOrdemServicoServicoMapper } from './prisma-os-servico-mapper.js'
import { PrismaOrdemServicoComponenteMapper } from './prisma-os-componente-mapper.js'
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { OrdemServicoComponenteList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-componente-list.js'
import { OrdemServicoServicoList } from '@/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico-list.js'

type PrismaOrdemServicoComRelacoes = PrismaOrdemServico & {
  servicos: PrismaOrdemServicoServico[]
  componentes: PrismaOrdemServicoComponente[]
}

export class PrismaOrdemServicoMapper {
  static toDomain(raw: PrismaOrdemServicoComRelacoes): OrdemServico {

    const componentes = raw.componentes.map(
      PrismaOrdemServicoComponenteMapper.toDomain,
    )
    const servicos = raw.servicos.map(
      PrismaOrdemServicoServicoMapper.toDomain,
    )

    return OrdemServico.criar({
      clienteId: new UniqueEntityID(raw.clienteId),
      veiculoId: new UniqueEntityID(raw.veiculoId),
      mecanicoId: raw.mecanicoId ? new UniqueEntityID(raw.mecanicoId) : undefined,
      descricao: raw.descricao,
      prioridade: Prioridade.restaurar(raw.prioridade, raw.prioridadePeso),
      eGarantia: raw.eGarantia,
      status: raw.status,
      componentes: new OrdemServicoComponenteList(componentes),
      servicos: new OrdemServicoServicoList(servicos),
      atualizadoEm: raw.atualizadoEm ?? undefined,
      criadoEm: raw.criadoEm,
    }, new UniqueEntityID(raw.id))
  }
  static toPrisma(os: OrdemServico): Prisma.OrdemServicoCreateInput {
    return {
      id: os.getId().toValue(),
      cliente: { connect: { id: os.getClienteId().toValue() } },
      veiculo: { connect: { id: os.getVeiculoId().toValue() } },
      ...(os.getMecanicoId() && {
        mecanico: { connect: { id: os.getMecanicoId()!.toString() } },
      }),
      descricao: os.getDescricao() ?? null,
      prioridade: os.getPrioridade().getTipo(),
      prioridadePeso: os.getPrioridade().getPeso(),
      eGarantia: os.getEGarantia(),
      status: os.getStatus(),
      componentes: {
        createMany: {
          data: os.getComponentes().getItems().map(PrismaOrdemServicoComponenteMapper.toPrisma)
        }
      },
      servicos: {
        createMany: {
          data: os.getServicos().getItems().map(PrismaOrdemServicoServicoMapper.toPrisma)
        }
      },
      atualizadoEm: os.getAtualizadoEm() ?? null,
      criadoEm: os.getCriadoEm()
    }
  }
}