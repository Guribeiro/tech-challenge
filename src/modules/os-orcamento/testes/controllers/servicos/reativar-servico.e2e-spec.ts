import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Reativar Servico (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let baseUrl: string

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)

    await app.listen(0)
    baseUrl = await app.getUrl()
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[PATCH] /servicos/:id/reativar', () => {
    it('deve reativar o serviço com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um serviço previamente desativado no banco (desativadoEm preenchido)
      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Serviço Inativo - ${randomUUID().substring(0, 8)}`,
          descricao: 'Serviço desativado anteriormente',
          valorReferencia: 10000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: new Date(), // Marcado como inativo
        },
      })

      // 2. Dispara a requisição PATCH para reativar
      const response = await fetch(`${baseUrl}/servicos/${servicoId}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      // 3. Valida no PostgreSQL se o campo desativadoEm foi limpo (retornou para null)
      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco).not.toBeNull()
      expect(servicoNoBanco?.desativadoEm).toBeNull()
    })

    it('deve permitir que um ADMIN também reative um serviço', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Serviço Admin Reativar - ${randomUUID().substring(0, 8)}`,
          descricao: 'Serviço desativado anteriormente',
          valorReferencia: 20000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: new Date(),
        },
      })

      const response = await fetch(`${baseUrl}/servicos/${servicoId}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco?.desativadoEm).toBeNull()
    })

    it('deve retornar 404 (Not Found) ao tentar reativar um serviço inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/servicos/${idInexistente}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar reativar serviço com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}/reativar`, {
        method: 'PATCH',
      })

      expect(response.status).toBe(401)
    })
  })
})