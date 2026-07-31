import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'

describe('Desativar Servico (E2E)', () => {
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
    await prisma.servico.deleteMany()
    await prisma.usuario.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[DELETE] /servicos/:id', () => {
    it('deve realizar soft-delete do serviço com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria o serviço no banco (ativo, desativadoEm = null)
      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Serviço a Desativar - ${randomUUID().substring(0, 8)}`,
          descricao: 'Descrição do serviço',
          valorReferencia: 15000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: null,
        },
      })

      // 2. Dispara a requisição DELETE
      const response = await fetch(`${baseUrl}/servicos/${servicoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      // 3. Valida no PostgreSQL se o registro persiste, mas com desativadoEm preenchido
      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco).not.toBeNull()
      expect(servicoNoBanco?.desativadoEm).not.toBeNull()
      expect(servicoNoBanco?.desativadoEm).toBeInstanceOf(Date)
    })

    it('deve permitir que um ADMIN também desative um serviço', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Serviço Admin Desativar - ${randomUUID().substring(0, 8)}`,
          descricao: 'Descrição do serviço',
          valorReferencia: 15000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: null,
        },
      })

      const response = await fetch(`${baseUrl}/servicos/${servicoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco?.desativadoEm).not.toBeNull()
    })

    it('deve retornar 404 (Not Found) ao tentar desativar um serviço inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/servicos/${idInexistente}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar desativar serviço com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
})