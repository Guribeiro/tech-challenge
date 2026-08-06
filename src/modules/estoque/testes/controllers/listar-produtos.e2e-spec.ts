import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { ListarProdutosResponseDto } from '../../dto/listar-produtos-response.dto.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Listar Produtos (E2E)', () => {
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

  describe('[GET] /produtos', () => {
    it('deve listar produtos paginados com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria produtos no banco de dados
      await prisma.produto.createMany({
        data: [
          {
            id: randomUUID(),
            nome: `Pastilha de Freio Dianteira - ${randomUUID().substring(0, 8)}`,
            tipo: 'PECA',
            codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
            precoCusto: 5000,
            precoUnitario: 9500,
            quantidadeEstoque: 20,
            desativadoEm: null,
          },
          {
            id: randomUUID(),
            nome: `Fluido de Freio DOT4 - ${randomUUID().substring(0, 8)}`,
            tipo: 'INSUMO',
            codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
            precoCusto: 1500,
            precoUnitario: 3500,
            quantidadeEstoque: 50,
            desativadoEm: null,
          },
        ],
      })

      // 2. Dispara a requisição GET
      const response = await fetch(`${baseUrl}/produtos?pagina=1&limite=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarProdutosResponseDto

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('produtos')
      expect(body.produtos).toHaveLength(2)
      expect(body).toHaveProperty('meta')
      expect(body.meta).toEqual({
        total: 2,
        pagina: 1,
        limite: 10,
        totalPaginas: 1,
      })
    })

    it('deve permitir acesso para perfis ADMIN e MECANICO', async () => {
      const { accessToken: tokenMecanico } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      await prisma.produto.create({
        data: {
          id: randomUUID(),
          nome: `Vela de Ignição Iridium - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 2500,
          precoUnitario: 6000,
          quantidadeEstoque: 16,
          desativadoEm: null,
        },
      })

      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMecanico}`,
        },
      })

      const body = await response.json() as ListarProdutosResponseDto

      expect(response.status).toBe(200)
      expect(body.produtos).toHaveLength(1)
    })

    it('deve filtrar produtos por nome e tipo', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const nomeExclusivo = `Aditivo Para Radiador - ${randomUUID().substring(0, 8)}`

      await prisma.produto.createMany({
        data: [
          {
            id: randomUUID(),
            nome: nomeExclusivo,
            tipo: 'INSUMO',
            codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
            precoCusto: 1200,
            precoUnitario: 2800,
            quantidadeEstoque: 40,
            desativadoEm: null,
          },
          {
            id: randomUUID(),
            nome: `Amortecedor Dianteiro - ${randomUUID().substring(0, 8)}`,
            tipo: 'PECA',
            codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
            precoCusto: 15000,
            precoUnitario: 32000,
            quantidadeEstoque: 8,
            desativadoEm: null,
          },
        ],
      })

      const response = await fetch(
        `${baseUrl}/produtos?nome=${encodeURIComponent('Aditivo Para Radiador')}&tipo=INSUMO`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const body = await response.json() as ListarProdutosResponseDto

      expect(response.status).toBe(200)
      expect(body.produtos).toHaveLength(1)
      expect(body.produtos[0].nome).toBe(nomeExclusivo)
      expect(body.meta.total).toBe(1)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })
})