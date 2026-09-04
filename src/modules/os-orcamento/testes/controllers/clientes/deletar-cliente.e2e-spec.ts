import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Use Case: Deletar Cliente (E2E)', () => {
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

  describe('[DELETE] /clientes/:id', () => {
    it('deve deletar um cliente com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um cliente prévio no banco de dados para ser removido
      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: cliente.getEmail().getValor(),
          documento: cliente.getDocumento().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      // 2. Executa a requisição DELETE
      const response = await fetch(
        `${baseUrl}/clientes/${cliente.getId().toValue()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      // 3. Valida o status 204 No Content
      expect(response.status).toBe(204)

      // 4. Garante a remoção física do banco de dados de teste
      const clienteNoBanco = await prisma.cliente.findUnique({
        where: { id: cliente.getId().toValue() },
      })

      expect(clienteNoBanco).not.toBeNull()
      expect(clienteNoBanco?.deletadoEm).toEqual(expect.any(Date))
    })

    it('deve permitir que um ADMIN também delete um cliente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: cliente.getEmail().getValor(),
          documento: cliente.getDocumento().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const response = await fetch(
        `${baseUrl}/clientes/${cliente.getId().toValue()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      // 3. Valida o status 204 No Content
      expect(response.status).toBe(204)

      // 4. Garante a remoção física do banco de dados de teste
      const clienteNoBanco = await prisma.cliente.findUnique({
        where: { id: cliente.getId().toValue() },
      })

      expect(clienteNoBanco).not.toBeNull()
      expect(clienteNoBanco?.deletadoEm).toEqual(expect.any(Date))
    })

    it('deve retornar 404 (Not Found) ao tentar deletar um cliente inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/clientes/${idInexistente}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar deletar um cliente com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: cliente.getEmail().getValor(),
          documento: cliente.getDocumento().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const response = await fetch(
        `${baseUrl}/clientes/${cliente.getId().toValue()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const clienteId = randomUUID()

      const response = await fetch(`${baseUrl}/clientes/${clienteId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
})