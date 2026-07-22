import { Injectable } from "@nestjs/common";
import { VeiculoRepository } from "@/modules/os-orcamento/domain/repositories/veiculos-repository.js";
import { Veiculo } from "@/modules/os-orcamento/domain/entities/veiculo.js";
import { PrismaService } from "../prisma.service.js";
import { PrismaVeiculoMapper } from "../mappers/prisma-veiculo-mapper.js";

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

}