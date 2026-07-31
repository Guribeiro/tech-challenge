import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { Role } from '../../domain/entities/usuario.js'
import { makeCliente } from '@/modules/os-orcamento/testes/factories/make-cliente.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'

interface MakeAuthUserParams {
  role?: Role
}

export async function makeUsuarioAutenticado(
  app: INestApplication,
  params: MakeAuthUserParams = {},
) {
  const prisma = app.get(PrismaService)
  const jwtService = app.get(JwtService)

  const role = params.role ?? 'ADMIN'
  const userId = new UniqueEntityID()

  // 1. Cria o Usuário no banco de testes (para satisfazer constraints ou consultas no Controller)
  const usuario = await prisma.usuario.create({
    data: {
      id: userId.toValue(),
      email: makeCliente().getEmail().getValor(),
      senhaHash: 'hash-de-teste',
      role,
    },
  })

  // 2. Gera o token JWT com a mesma assinatura usada pelo AuthModule
  const accessToken = jwtService.sign({
    sub: usuario.id,
    role: usuario.role,
  })

  return {
    accessToken,
    usuario,
  }
}