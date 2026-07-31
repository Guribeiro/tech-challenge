import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'

describe('Desativar Produto (E2E)', () => {
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
    await prisma.produto.deleteMany()
    await prisma.usuario.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[DELETE] /produtos/:id', () => {
    it('deve realizar soft-delete do produto com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um produto ativo no banco de dados
      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Produto a Desativar - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 5000,
          precoUnitario: 9000,
          quantidadeEstoque: 15,
          desativadoEm: null,
        },
      })

      // 2. Dispara a requisição DELETE
      const response = await fetch(`${baseUrl}/produtos/${produtoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      // 3. Valida no PostgreSQL se o registro permanece no banco, mas com desativadoEm preenchido
      const produtoNoBanco = await prisma.produto.findUnique({
        where: { id: produtoId },
      })

      expect(produtoNoBanco).not.toBeNull()
      expect(produtoNoBanco?.desativadoEm).not.toBeNull()
      expect(produtoNoBanco?.desativadoEm).toBeInstanceOf(Date)
    })

    it('deve permitir que um ADMIN também desative um produto', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Produto Admin Desativar - ${randomUUID().substring(0, 8)}`,
          tipo: 'INSUMO',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 3000,
          precoUnitario: 6000,
          quantidadeEstoque: 30,
          desativadoEm: null,
        },
      })

      const response = await fetch(`${baseUrl}/produtos/${produtoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      const produtoNoBanco = await prisma.produto.findUnique({
        where: { id: produtoId },
      })

      expect(produtoNoBanco?.desativadoEm).not.toBeNull()
    })

    it('deve retornar 404 (Not Found) ao tentar desativar um produto inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/produtos/${idInexistente}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar desativar produto com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/produtos/${randomUUID()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/produtos/${randomUUID()}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
})