import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { randomUUID } from 'node:crypto'
import { Email } from '@/shared/domain/value-objects/email.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Editar Cliente (E2E)', () => {
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

  describe('[PUT] /clientes/:id', () => {
    it('deve editar um cliente com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria o cliente inicial no banco de dados via factory
      const clienteOriginal = makeCliente({
        email: Email.criar(`original.${randomUUID().substring(0, 8)}@example.com`),
      })

      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: clienteOriginal.getEmail().getValor(),
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const clienteId = clienteOriginal.getId().toValue()
      const novoNome = 'Juliana Costa Editada'
      const novoEmail = `editado.${randomUUID().substring(0, 8)}@example.com`

      // 2. Executa a requisição de atualização
      const response = await fetch(`${baseUrl}/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: '(11) 98888-7777',
          tipo: 'PF',
        }),
      })

      const body = await response.json() as { cliente: { nome: string, email: string } }

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('cliente')
      expect(body.cliente.nome).toBe(novoNome)
      expect(body.cliente.email).toBe(novoEmail)

      // 3. Valida a persistência no PostgreSQL
      const clienteNoBanco = await prisma.cliente.findUnique({
        where: { id: clienteId },
      })

      expect(clienteNoBanco).not.toBeNull()
      expect(clienteNoBanco?.nome).toBe(novoNome)
      expect(clienteNoBanco?.email).toBe(novoEmail)
    })

    it('deve permitir que um ADMIN também edite um cliente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: clienteOriginal.getEmail().getValor(),
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const clienteId = clienteOriginal.getId().toValue()

      const response = await fetch(`${baseUrl}/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Nome Atualizado por Admin',
          email: `admin.${randomUUID().substring(0, 8)}@example.com`,
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(200)

      const clienteNoBanco = await prisma.cliente.findUnique({
        where: { id: clienteId },
      })

      expect(clienteNoBanco?.nome).toBe('Nome Atualizado por Admin')
    })

    it('deve retornar 404 (Not Found) ao tentar editar um cliente inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/clientes/${idInexistente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Fantasma',
          email: `fantasma.${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '(11) 99999-9999',
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar editar com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const clienteId = randomUUID()

      const response = await fetch(`${baseUrl}/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: 'Tentativa Negada',
          email: `negado.${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '(11) 99999-9999',
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/clientes/${randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: 'Sem Token',
          email: `semtoken.${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '(11) 99999-9999',
          tipo: 'PF',
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})