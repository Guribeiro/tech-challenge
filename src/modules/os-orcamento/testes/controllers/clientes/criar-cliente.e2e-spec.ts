import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { makeCliente } from '../../factories/make-cliente.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Cliente (E2E)', () => {
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

  describe('[POST] /clientes', () => {
    it('deve criar um cliente com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const payload = {
        nome: 'Juliana Costa',
        email: 'juliana.costa@oficina.com',
        cpf: gerarCpf(),
        telefone: makeCliente().getTelefone().getValor(),
        tipo: 'PF',
      }

      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      expect([200, 201]).toContain(response.status)
      expect(body).toHaveProperty('cliente')

      const clienteNoBanco = await prisma.cliente.findFirst({
        where: { email: payload.email },
      })

      expect(clienteNoBanco).not.toBeNull()
      expect(clienteNoBanco?.nome).toBe(payload.nome)
    })

    it('deve permitir que um ADMIN também crie um cliente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const payload = {
        nome: 'Maria Souza',
        email: 'maria.souza@example.com',
        cpf: gerarCpf(),
        telefone: makeCliente().getTelefone().getValor(),
        tipo: 'PF',
      }

      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json() as { cliente: { id: string } }

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('cliente')

      // 🎯 Busca pelo ID exato que a API acabou de retornar no body
      const clienteNoBanco = await prisma.cliente.findUnique({
        where: { id: body.cliente.id },
      })

      expect(clienteNoBanco).not.toBeNull()
      expect(clienteNoBanco?.email).toBe(payload.email)
    })

    it('deve retornar 403 (Forbidden) ao tentar criar um cliente com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Carlos Santos',
          email: 'carlos@example.com',
          cpf: gerarCpf(),
          telefone: makeCliente().getTelefone().getValor(),
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: 'Sem Token',
          email: 'semtoken@example.com',
          cpf: gerarCpf(),
          telefone: makeCliente().getTelefone().getValor(),
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar e-mail já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const payload = {
        nome: 'Cliente Duplicado',
        email: 'duplicado@example.com',
        cpf: gerarCpf(),
        telefone: makeCliente().getTelefone().getValor(),
        tipo: 'PF',
      }

      // 1ª Criação (Sucesso)
      await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      // 2ª Criação com o mesmo e-mail (Falha por Conflito)
      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...payload,
          cpf: gerarCpf(), // CPF diferente, mesmo e-mail
        }),
      })

      expect(response.status).toBe(409)
    })
  })
})