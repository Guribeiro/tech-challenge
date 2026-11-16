import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js";
import { BuscarFilaTrabalhoParams, BuscarFilaTrabalhoResultado, CalcularTempoMedioParams, ListarOrdensServicoAtivasParams, ListarOrdensServicoAtivasResultado, OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { PrismaOrdemServicoMapper } from "../mappers/prisma-ordem-servico-mapper.js";
import { PrismaOrdemServicoServicoMapper } from "../mappers/prisma-os-servico-mapper.js";
import { PrismaOrdemServicoComponenteMapper } from "../mappers/prisma-os-componente-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js";
import { Prisma } from "@/generated/prisma/client.js";
import { STATUS_FINALIZADOS, PRIORIDADE_STATUS } from "@/modules/os-orcamento/domain/constants/status-prioridade.js";
import { Telemetry, TELEMETRY_EVENTS } from "@/infra/observability/telemetry.js";

type StatusRegistrado = { statusNovo: string; alteradoEm: Date } | null

@Injectable()
export class PrismaOrdemServicoRepository implements OrdemServicoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetry: Telemetry,
  ) { }

  public async create(ordem: OrdemServico): Promise<void> {
    const data = PrismaOrdemServicoMapper.toPrisma(ordem)
    await this.prisma.ordemServico.create({ data })
    this.registrarMudancaDeStatus(ordem, null)
    await DomainEvents.dispatchEventsForAggregate(ordem)
  }

  /** Último status registrado pelo trigger de histórico (ordem_servico_historico_status). */
  private async buscarStatusRegistrado(ordemServicoId: string): Promise<StatusRegistrado> {
    return this.prisma.ordemServicoHistoricoStatus.findFirst({
      where: { ordemServicoId },
      orderBy: { alteradoEm: 'desc' },
      select: { statusNovo: true, alteradoEm: true },
    })
  }

  /**
   * Emite OrdemServicoStatusAlterada com o tempo de permanência no status anterior,
   * base dos dashboards de volume diário e tempo médio por status.
   */
  private registrarMudancaDeStatus(ordem: OrdemServico, anterior: StatusRegistrado): void {
    const statusNovo = ordem.getStatus()

    if (anterior?.statusNovo === statusNovo) return

    this.telemetry.recordEvent(TELEMETRY_EVENTS.ORDEM_SERVICO_STATUS_ALTERADA, {
      ordemServicoId: ordem.getId().toValue(),
      statusAnterior: anterior?.statusNovo ?? null,
      statusNovo,
      duracaoNoStatusAnteriorSeg: anterior
        ? Math.round((Date.now() - anterior.alteradoEm.getTime()) / 1000)
        : null,
      prioridade: ordem.getPrioridade().getTipo(),
    })
  }

  public async findById(id: string): Promise<OrdemServico | null> {
    const raw = await this.prisma.ordemServico.findUnique({
      where: {
        id
      },
      include: {
        componentes: true,
        servicos: true
      }
    })

    if (!raw) return null

    return PrismaOrdemServicoMapper.toDomain(raw)
  }

  public async save(ordem: OrdemServico): Promise<void> {
    const { componentes: _, servicos: __, ...data } = PrismaOrdemServicoMapper.toPrisma(ordem)
    const ordemServicoId = ordem.getId().toValue()

    const servicosList = ordem.getServicos()
    const novosServicos = servicosList.getNewItems().map((item) => ({
      ...PrismaOrdemServicoServicoMapper.toPrisma(item),
      ordemServicoId,
    }))
    const servicosRemovidos = servicosList.getRemovedItems()

    const componentesList = ordem.getComponentes()
    const novosComponentes = componentesList.getNewItems().map((item) => ({
      ...PrismaOrdemServicoComponenteMapper.toPrisma(item),
      ordemServicoId,
    }))
    const componentesRemovidos = componentesList.getRemovedItems()

    const statusAnterior = await this.buscarStatusRegistrado(ordemServicoId)

    await this.prisma.$transaction([
      this.prisma.ordemServico.update({
        where: { id: data.id },
        data,
      }),

      ...(servicosRemovidos.length > 0
        ? [
          this.prisma.ordemServicoServico.deleteMany({
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
          this.prisma.ordemServicoServico.createMany({
            data: novosServicos,
          }),
        ]
        : []),

      ...(componentesRemovidos.length > 0
        ? [
          this.prisma.ordemServicoComponente.deleteMany({
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
          this.prisma.ordemServicoComponente.createMany({
            data: novosComponentes,
          }),
        ]
        : []),
    ])

    this.registrarMudancaDeStatus(ordem, statusAnterior)

    await DomainEvents.dispatchEventsForAggregate(ordem)
    ordem.clearEvents()
  }

  public async listServiceQueue({
    pagina,
    limite,
    status = 'RECEBIDA'
  }: BuscarFilaTrabalhoParams): Promise<BuscarFilaTrabalhoResultado> {
    const where: Prisma.OrdemServicoWhereInput = {}

    if (status) {
      where.status = status
    }

    const [raw, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        include: {
          componentes: true,
          servicos: true,
        },
        orderBy: {
          prioridadePeso: "desc",
        },
      }),
      this.prisma.ordemServico.count({ where })
    ]);

    return {
      ordensServicos: raw.map(PrismaOrdemServicoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

  async listActiveOrders({ pagina, limite }: ListarOrdensServicoAtivasParams): Promise<ListarOrdensServicoAtivasResultado> {
    const [raw, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where: {
          status: {
            notIn: [...STATUS_FINALIZADOS],
          },
        },
        include: {
          componentes: true,
          servicos: true,
        },
        orderBy: {
          criadoEm: 'asc',
        },
      }),
      this.prisma.ordemServico.count({
        where: {
          status: {
            notIn: [...STATUS_FINALIZADOS],
          },
        },
      }),
    ])

    const ordensOrdenadas = raw.toSorted((a, b) => {
      const prioridadeA = PRIORIDADE_STATUS[a.status] ?? 99
      const prioridadeB = PRIORIDADE_STATUS[b.status] ?? 99

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB
      }

      return a.criadoEm.getTime() - b.criadoEm.getTime()
    })

    const paginadas = ordensOrdenadas.slice((pagina - 1) * limite, pagina * limite)

    return {
      ordensServicos: paginadas.map(PrismaOrdemServicoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

  public async findManyReadyToInitialize(
    mecanicoId?: string,
  ): Promise<OrdemServico[]> {
    const raw = await this.prisma.ordemServico.findMany({
      where: {
        status: "PRONTA_PARA_INICIAR",
        ...(mecanicoId && { mecanicoId }),
      },
      include: {
        componentes: true,
        servicos: true,
      },
      orderBy: {
        prioridadePeso: "desc",
      },
    });

    return raw.map(PrismaOrdemServicoMapper.toDomain);
  }

  async findByClienteIdAndVeiculoId(clienteId: string, veiculoId: string): Promise<OrdemServico | null> {
    const raw = await this.prisma.ordemServico.findFirst({
      where: {
        clienteId,
        veiculoId,
      },
      include: {
        veiculo: true,
        cliente: true,
        componentes: true,
        servicos: true,
      },
    });

    if (!raw) return null;

    return PrismaOrdemServicoMapper.toDomain(raw);
  }

  async calcularTempoMedio(params?: CalcularTempoMedioParams) {
    const dataInicio = params?.dataInicio ?? null;
    const dataFim = params?.dataFim ?? null;

    const resultado = await this.prisma.$queryRaw<
      Array<{ tempo_medio_minutos: number | null; total_servicos_concluidos: number }>
    >`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (finalizado_em - iniciado_em)) / 60) as tempo_medio_minutos,
      COUNT(id)::int as total_servicos_concluidos
    FROM ordem_servicos
    WHERE status = 'FINALIZADA'
      AND iniciado_em IS NOT NULL
      AND finalizado_em IS NOT NULL
      AND (${dataInicio}::timestamp IS NULL OR finalizado_em >= ${dataInicio})
      AND (${dataFim}::timestamp IS NULL OR finalizado_em <= ${dataFim})
  `;

    const dados = resultado[0] || { tempo_medio_minutos: 0, total_servicos_concluidos: 0 };

    return {
      tempoMedioMinutos: Number(dados.tempo_medio_minutos || 0),
      totalServicosConcluidos: Number(dados.total_servicos_concluidos || 0),
    };
  }


}