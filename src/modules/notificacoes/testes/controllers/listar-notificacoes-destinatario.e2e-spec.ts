import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'
import { ListarNotificacoesDestinatarioResponseDto } from '../../dto/listar-notificacoes-destinatario-response.dto.js'

describe('Listar Notificações do Destinatário (E2E)', () => {
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

  describe('[GET] /notificacoes', () => {
    it('deve listar notificações do destinatário autenticado com paginação e metadados', async () => {
      const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      await prisma.notificacao.createMany({
        data: [
          {
            id: randomUUID(),
            destinatarioId: usuario.id,
            titulo: 'Notificação 1',
            conteudo: 'Conteúdo da notificação 1',
            template: 'teste',
            contexto: { tipo: 'alerta' },
            lidaEm: null,
            criadaEm: new Date(),
          },
          {
            id: randomUUID(),
            destinatarioId: usuario.id,
            titulo: 'Notificação 2',
            conteudo: 'Conteúdo da notificação 2',
            template: 'evento',
            contexto: { tipo: 'info' },
            lidaEm: new Date(),
            criadaEm: new Date(Date.now() - 1000 * 60),
          },
          {
            id: randomUUID(),
            destinatarioId: usuario.id,
            titulo: 'Notificação 3',
            conteudo: 'Conteúdo da notificação 3',
            template: 'aviso',
            contexto: { tipo: 'aviso' },
            lidaEm: null,
            criadaEm: new Date(Date.now() - 1000 * 120),
          },
        ],
      })

      const response = await fetch(`${baseUrl}/notificacoes?pagina=1&limite=2`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarNotificacoesDestinatarioResponseDto

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('notificacoes')
      expect(body.notificacoes).toHaveLength(2)
      expect(body.notificacoes.every((item: any) => item.lidaEm === null)).toBe(true)

      expect(body).toHaveProperty('meta')
      expect(body.meta).toEqual({
        total: 2,
        pagina: 1,
        limite: 2,
        totalPaginas: 1,
      })
    })

    it('deve retornar 401 quando o token não for fornecido', async () => {
      const response = await fetch(`${baseUrl}/notificacoes`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })
})
