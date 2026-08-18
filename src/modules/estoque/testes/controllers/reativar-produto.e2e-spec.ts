import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Reativar Produto (E2E)', () => {
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

  describe('[PATCH] /produtos/:id/reativar', () => {
    it('deve reativar o produto com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um produto desativado no banco de dados (desativadoEm com data)
      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Produto Inativo - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 4500,
          precoUnitario: 8000,
          quantidadeEstoque: 20,
          desativadoEm: new Date(),
        },
      })

      // 2. Dispara a requisição PATCH para reativar
      const response = await fetch(`${baseUrl}/produtos/${produtoId}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      // 3. Valida no PostgreSQL se o campo desativadoEm foi limpo (voltou a ser null)
      const produtoNoBanco = await prisma.produto.findUnique({
        where: { id: produtoId },
      })

      expect(produtoNoBanco).not.toBeNull()
      expect(produtoNoBanco?.desativadoEm).toBeNull()
    })

    it('deve permitir que um ADMIN também reative um produto', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Produto Admin Reativar - ${randomUUID().substring(0, 8)}`,
          tipo: 'INSUMO',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 2500,
          precoUnitario: 5000,
          quantidadeEstoque: 40,
          desativadoEm: new Date(),
        },
      })

      const response = await fetch(`${baseUrl}/produtos/${produtoId}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      const produtoNoBanco = await prisma.produto.findUnique({
        where: { id: produtoId },
      })

      expect(produtoNoBanco?.desativadoEm).toBeNull()
    })

    it('deve retornar 404 (Not Found) ao tentar reativar um produto inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/produtos/${idInexistente}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar reativar produto com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/produtos/${randomUUID()}/reativar`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/produtos/${randomUUID()}/reativar`, {
        method: 'PATCH',
      })

      expect(response.status).toBe(401)
    })
  })
})