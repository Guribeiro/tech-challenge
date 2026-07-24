import { BuscarProdutosParams, BuscarProdutosResultado, ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { Produto } from "@/modules/estoque/domain/entities/produto.js";
import { PrismaProdutoMapper } from "../mappers/prisma-produto-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js";
import { Prisma } from "@/generated/prisma/client.js";

@Injectable()
export class PrismaProdutoRepository implements ProdutoRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(produto: Produto): Promise<void> {
    const data = PrismaProdutoMapper.toPrisma(produto)
    await this.prisma.produto.create({ data })

    await DomainEvents.dispatchEventsForAggregate(produto)
  }

  public async findById(id: string): Promise<Produto | null> {
    const raw = await this.prisma.produto.findUnique({
      where: {
        id,
      }
    })

    if (!raw) return null

    return PrismaProdutoMapper.toDomain(raw)
  }

  public async findByNome(nome: string): Promise<Produto | null> {
    const raw = await this.prisma.produto.findFirst({
      where: {
        nome,
        desativadoEm: null,
      }
    })

    if (!raw) return null

    return PrismaProdutoMapper.toDomain(raw)
  }

  public async findManyByIds(ids: string[]): Promise<Produto[]> {
    const raw = await this.prisma.produto.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return raw.map(PrismaProdutoMapper.toDomain)
  }

  public async list(): Promise<Produto[]> {
    const raw = await this.prisma.produto.findMany()
    return raw.map(PrismaProdutoMapper.toDomain)
  }

  public async save(produto: Produto): Promise<void> {
    const data = PrismaProdutoMapper.toPrisma(produto);

    await this.prisma.produto.update({
      where: { id: data.id },
      data,
    });

    await DomainEvents.dispatchEventsForAggregate(produto)
  }

  public async findMany({
    pagina,
    limite,
    status = 'ativos', // Padrão: trazer apenas os não deletados
    nome,
  }: BuscarProdutosParams): Promise<BuscarProdutosResultado> {
    const where: Prisma.ProdutoWhereInput = {}

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

    const [rawProdutos, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        take: limite,
        skip: (pagina - 1) * limite,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.produto.count({ where }),
    ])

    return {
      produtos: rawProdutos.map(PrismaProdutoMapper.toDomain),
      total,
      pagina,
      limite,
    }
  }


  public async delete(id: string): Promise<void> {
    await this.prisma.produto.delete({ where: { id } })
  }

}