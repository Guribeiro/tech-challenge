import { Injectable } from "@nestjs/common";

import { Cliente } from "@/modules/os-orcamento/domain/entities/cliente.js";
import {
  BuscarClientesParams,
  BuscarClientesResultado,
  ClienteRepository
} from "@/modules/os-orcamento/domain/repositories/clientes-repository.js";
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { PrismaClienteMapper } from "../mappers/prisma-cliente-mapper.js";
import { Prisma } from "@/generated/prisma/client.js";
import { DomainEvents } from "@/core/events/domain-events.js";

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(cliente: Cliente): Promise<void> {
    const data = PrismaClienteMapper.toPrisma(cliente)
    await this.prisma.cliente.create({ data })

    DomainEvents.dispatchEventsForAggregate(cliente)
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

  public async findByEmail(email: string): Promise<Cliente | null> {
    const raw = await this.prisma.cliente.findUnique({
      where: {
        email
      }
    })

    if (!raw) return null

    return PrismaClienteMapper.toDomain(raw)
  }


  public async findByCpf(cpf: string): Promise<Cliente | null> {
    const raw = await this.prisma.cliente.findUnique({
      where: {
        cpf
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

    DomainEvents.dispatchEventsForAggregate(cliente)
  }

  public async list(): Promise<Cliente[]> {
    const raw = await this.prisma.cliente.findMany()
    const clientes = raw.map(cliente => PrismaClienteMapper.toDomain(cliente))

    return clientes
  }

  public async findMany({
    pagina,
    limite,
    status = 'ativos', // Padrão: trazer apenas os não deletados
    nome,
  }: BuscarClientesParams): Promise<BuscarClientesResultado> {
    const where: Prisma.ClienteWhereInput = {}

    if (status === 'ativos') {
      where.deletadoEm = null
    } else if (status === 'deletados') {
      where.deletadoEm = { not: null }
    }

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      }
    }

    const [rawClientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.cliente.count({ where }),
    ])

    return {
      clientes: rawClientes.map(PrismaClienteMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.cliente.delete({ where: { id } })
  }
} 