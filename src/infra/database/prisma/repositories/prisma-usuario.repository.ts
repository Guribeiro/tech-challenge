import { Injectable } from "@nestjs/common";

import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js";
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js";
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { PrismaUsuarioMapper } from "../mappers/prisma-usuario-mapper.js";
import { DomainEvents } from "@/core/events/domain-events.js";

@Injectable()
export class PrismaUsuarioRepository implements UsuariosRepository {
  constructor(private readonly prisma: PrismaService) { }

  public async create(usuario: Usuario): Promise<void> {
    const data = PrismaUsuarioMapper.toPrisma(usuario)
    await this.prisma.usuario.create({ data })
    await DomainEvents.dispatchEventsForAggregate(usuario)
  }

  public async findByEmail(email: string): Promise<Usuario | null> {
    const raw = await this.prisma.usuario.findUnique({
      where: {
        email
      }
    })

    if (!raw) return null

    return PrismaUsuarioMapper.toDomain(raw)
  }

  public async findById(id: string): Promise<Usuario | null> {
    const raw = await this.prisma.usuario.findUnique({
      where: {
        id
      }
    })

    if (!raw) return null

    return PrismaUsuarioMapper.toDomain(raw)
  }
} 