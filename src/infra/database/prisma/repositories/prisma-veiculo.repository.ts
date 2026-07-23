import { Injectable } from "@nestjs/common";
import { BuscarVeiculosParams, BuscarVeiculosResultado, VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js";
import { Veiculo } from "@/modules/os-orcamento/domain/entities/veiculo.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaVeiculoMapper } from "../mappers/prisma-veiculo-mapper.js";
import { Prisma } from "@/generated/prisma/client.js";

@Injectable()
export class PrismaVeiculoRepository implements VeiculoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async list(): Promise<Veiculo[]> {
    const raw = await this.prisma.veiculo.findMany()
    const veiculos = raw.map(veiculo => PrismaVeiculoMapper.toDomain(veiculo))

    return veiculos
  }

  public async create(veiculo: Veiculo): Promise<void> {
    const data = PrismaVeiculoMapper.toPrisma(veiculo)
    await this.prisma.veiculo.create({ data })
  }


  public async findById(id: string): Promise<Veiculo | null> {
    const raw = await this.prisma.veiculo.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaVeiculoMapper.toDomain(raw)
  }

  public async findByLicensePlate(placa: string): Promise<Veiculo | null> {
    const raw = await this.prisma.veiculo.findUnique({
      where: {
        placa
      }
    })

    if (!raw) return null

    return PrismaVeiculoMapper.toDomain(raw)
  }

  public async save(veiculo: Veiculo): Promise<void> {
    const data = PrismaVeiculoMapper.toPrisma(veiculo);

    await this.prisma.veiculo.update({
      where: { id: data.id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.veiculo.update({
      where: {
        id
      },
      data: {
        deletadoEm: new Date()
      }
    })
  }

  public async findMany({
    limite,
    pagina,
    status
  }: BuscarVeiculosParams): Promise<BuscarVeiculosResultado> {
    const where: Prisma.VeiculoWhereInput = {}

    if (status === 'ativos') {
      where.deletadoEm = null
    } else if (status === 'deletados') {
      where.deletadoEm = { not: null }
    }


    const [rawClientes, total] = await Promise.all([
      this.prisma.veiculo.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.veiculo.count({ where }),
    ])

    return {
      veiculos: rawClientes.map(PrismaVeiculoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

}