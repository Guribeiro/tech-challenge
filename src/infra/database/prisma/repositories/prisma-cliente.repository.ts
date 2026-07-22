import { Injectable } from "@nestjs/common";

import { Cliente } from "@/modules/os-orcamento/domain/entities/cliente.js";
import { ClienteRepository } from "@/modules/os-orcamento/domain/repositories/clientes-repository.js";
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { PrismaClienteMapper } from "../mappers/prisma-cliente-mapper.js";

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(cliente: Cliente): Promise<void> {
    const data = PrismaClienteMapper.toPrisma(cliente)
    await this.prisma.cliente.create({ data })
  }

  public async findById(id: string): Promise<Cliente | null> {
    const raw = await this.prisma.cliente.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaClienteMapper.toDomain(raw)
  }

  public async save(cliente: Cliente): Promise<void> {
    const data = PrismaClienteMapper.toPrisma(cliente);

    await this.prisma.cliente.update({
      where: { id: data.id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.cliente.delete({ where: { id } })
  }
} 