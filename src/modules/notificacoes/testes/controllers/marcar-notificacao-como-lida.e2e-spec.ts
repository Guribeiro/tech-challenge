import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Marcar Notificação como Lida (E2E)', () => {
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

  describe('[PATCH] /notificacoes/:notificacaoId/marcar-como-lida', () => {
    it('deve marcar a notificação como lida para o destinatário autenticado', async () => {
      const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const notificacaoId = randomUUID()
      await prisma.notificacao.create({
        data: {
          id: notificacaoId,
          destinatarioId: usuario.id,
          titulo: 'Notificação não lida',
          conteudo: 'Conteúdo da notificação',
          template: 'teste',
          contexto: { origem: 'sistema' },
          lidaEm: null,
          criadaEm: new Date(),
        },
      })

      const response = await fetch(
        `${baseUrl}/notificacoes/${notificacaoId}/marcar-como-lida`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(204)

      const notificacao = await prisma.notificacao.findUnique({
        where: { id: notificacaoId },
      })

      expect(notificacao).toBeDefined()
      expect(notificacao?.lidaEm).not.toBeNull()
    })

    it('deve retornar 401 quando o token não for fornecido', async () => {
      const notificacaoId = randomUUID()

      const response = await fetch(
        `${baseUrl}/notificacoes/${notificacaoId}/marcar-como-lida`,
        {
          method: 'PATCH',
        },
      )

      expect(response.status).toBe(401)
    })

    it('deve retornar 403 quando autenticado com outro destinatário', async () => {
      // Usuário autenticado que fará a requisição
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // Segundo usuário real no banco para ser o verdadeiro destinatário da notificação
      const { usuario: outroUsuario } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const notificacaoId = randomUUID()
      await prisma.notificacao.create({
        data: {
          id: notificacaoId,
          destinatarioId: outroUsuario.id, // Utiliza o ID do usuário persistido
          titulo: 'Outros destinatário',
          conteudo: 'Conteúdo inválido',
          template: 'teste',
          contexto: { origem: 'sistema' },
          lidaEm: null,
          criadaEm: new Date(),
        },
      })

      const response = await fetch(
        `${baseUrl}/notificacoes/${notificacaoId}/marcar-como-lida`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })
  })
})
