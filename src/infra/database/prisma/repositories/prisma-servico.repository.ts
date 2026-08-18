import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js";
import { Prisma } from "@/generated/prisma/client.js";
import { ServicoRepository, BuscarServicosParams, BuscarServicosResultado } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js";
import { PrismaServicoMapper } from "../mappers/prisma-servico-mapper.js";

@Injectable()
export class PrismaServicoRepository implements ServicoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(servico: Servico): Promise<void> {
    const data = PrismaServicoMapper.toPrisma(servico)
    await this.prisma.servico.create({ data })
  }

  public async findById(id: string): Promise<Servico | null> {
    const raw = await this.prisma.servico.findUnique({
      where: {
        id,
      }
    })

    if (!raw) return null

    return PrismaServicoMapper.toDomain(raw)
  }

  public async findByNome(nome: string): Promise<Servico | null> {
    const raw = await this.prisma.servico.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: 'insensitive'
        },
        desativadoEm: null,
      }
    })

    if (!raw) return null

    return PrismaServicoMapper.toDomain(raw)
  }

  public async findManyByIds(ids: string[]): Promise<Servico[]> {
    const raw = await this.prisma.servico.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return raw.map(PrismaServicoMapper.toDomain)
  }

  public async list(): Promise<Servico[]> {
    const raw = await this.prisma.servico.findMany()
    return raw.map(PrismaServicoMapper.toDomain)
  }

  public async save(servico: Servico): Promise<void> {
    const data = PrismaServicoMapper.toPrisma(servico);

    await this.prisma.servico.update({
      where: { id: data.id },
      data,
    });

  }

  public async findMany({
    pagina,
    limite,
    status = 'ativos', // Padrão: trazer apenas os não deletados
    nome,
  }: BuscarServicosParams): Promise<BuscarServicosResultado> {
    const where: Prisma.ServicoWhereInput = {}

    if (status === 'ativos') {
      where.desativadoEm = null
    } else if (status === 'deletados') {
      where.desativadoEm = { not: null }
    }

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      }
    }

    const [rawServicos, total] = await Promise.all([
      this.prisma.servico.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.servico.count({ where }),
    ])

    return {
      servicos: rawServicos.map(PrismaServicoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }


  public async delete(id: string): Promise<void> {
    await this.prisma.servico.delete({ where: { id } })
  }

}