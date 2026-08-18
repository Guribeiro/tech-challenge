import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Mecânico (E2E)', () => {
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

  describe('[POST] /mecanicos', () => {
    it('deve criar um mecânico com sucesso quando autenticado como ADMIN', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const payload = {
        nome: 'João Mecânico',
        email: 'joao.mecanico@example.com',
        cpf: gerarCpf(),
        especialidade: 'Mecânica Geral',
      }

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      expect([200, 201]).toContain(response.status)
      expect(body).toHaveProperty('mecanico')

      const mecanicoNoBanco = await prisma.mecanico.findFirst({
        where: {
          email: payload.email,
        },
      })

      expect(mecanicoNoBanco).not.toBeNull()
      expect(mecanicoNoBanco?.nome).toBe(payload.nome)
    })

    it('deve retornar 403 (Forbidden) quando um RECEPCAO tentar criar um mecânico', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'João Mecânico',
          email: 'joao@example.com',
          cpf: gerarCpf(),
          especialidade: 'Suspensão',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 403 (Forbidden) quando um MECANICO tentar criar outro mecânico', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Novo Mecânico',
          email: 'novo@example.com',
          cpf: gerarCpf(),
          especialidade: 'Motor',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) quando nenhum token JWT for informado', async () => {
      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: 'Sem Token',
          email: 'semtoken@example.com',
          cpf: gerarCpf(),
          especialidade: 'Freios',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar um e-mail já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const payload = {
        nome: 'João Mecânico',
        email: 'duplicado@example.com',
        cpf: gerarCpf(),
        especialidade: 'Motor',
      }

      await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...payload,
          cpf: gerarCpf(),
        }),
      })

      expect(response.status).toBe(409)
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar um CPF já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const cpf = gerarCpf()

      await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'João Mecânico',
          email: 'joao@example.com',
          cpf,
          especialidade: 'Motor',
        }),
      })

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Pedro Mecânico',
          email: 'pedro@example.com',
          cpf,
          especialidade: 'Freios',
        }),
      })

      expect(response.status).toBe(409)
    })

    it('deve persistir o mecânico utilizando o ID retornado pela API', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const payload = {
        nome: 'Carlos Mecânico',
        email: 'carlos@example.com',
        cpf: gerarCpf(),
        especialidade: 'Suspensão',
      }

      const response = await fetch(`${baseUrl}/mecanicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = (await response.json()) as {
        mecanico: {
          id: string
        }
      }

      expect(response.status).toBe(200)

      const mecanicoNoBanco = await prisma.mecanico.findUnique({
        where: {
          id: body.mecanico.id,
        },
      })

      expect(mecanicoNoBanco).not.toBeNull()
      expect(mecanicoNoBanco?.email).toBe(payload.email)
    })
  })
})