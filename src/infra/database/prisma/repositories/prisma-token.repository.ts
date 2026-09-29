import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { PrismaTokenMapper } from "../mappers/prisma-token-mapper.js";
import { TokenRepository } from "@/modules/os-orcamento/domain/repositories/token-repository.js";
import { Token } from "@/modules/os-orcamento/domain/entities/token.js";

@Injectable()
export class PrismaTokenRepository implements TokenRepository {
  constructor(private readonly prisma: PrismaService) { }


  public async create(token: Token): Promise<void> {
    const data = PrismaTokenMapper.toPrisma(token)
    await this.prisma.token.create({ data })
  }


  public async findByToken(token: string): Promise<Token | null> {
    const raw = await this.prisma.token.findUnique({
      where: {
        token
      }
    })

    if (!raw) return null

    return PrismaTokenMapper.toDomain(raw)
  }


  public async save(token: Token): Promise<void> {
    const data = PrismaTokenMapper.toPrisma(token);

    await this.prisma.token.update({
      where: { id: data.id },
      data,
    });
  }
}