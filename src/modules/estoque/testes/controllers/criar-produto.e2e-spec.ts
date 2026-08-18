import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { ProdutoResponseDto } from '../../dto/produto-response.dto.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Produto (E2E)', () => {
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

  describe('[POST] /produtos', () => {
    it('deve cadastrar um novo produto com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const sku = `SKU-${randomUUID().substring(0, 8)}`
      const nomeProduto = `Filtro de Óleo - ${randomUUID().substring(0, 8)}`

      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: nomeProduto,
          tipo: 'PECA',
          marca: 'Motul',
          codigoSKU: sku,
          codigoFabricante: 'FAB-12345',
          descricao: 'Filtro de alta performance',
          precoCusto: 3550,
          precoUnitario: 6500,
          quantidadeEstoque: 50,
          estoqueMinimo: 10,
          estoqueMaximo: 200,
          unidadeMedida: 'UN',
          localizacao: 'Prateleira A2',
        }),
      })

      const body = await response.json() as { produto: ProdutoResponseDto }

      expect(response.status).toBe(201)
      expect(body.produto).toHaveProperty('id')
      expect(body.produto.nome).toBe(nomeProduto)
      expect(body.produto.codigoSKU).toBe(sku)

      // Validação de persistência real no PostgreSQL via Prisma
      const produtoNoBanco = await prisma.produto.findFirst({
        where: { id: body.produto.id },
      })

      expect(produtoNoBanco).not.toBeNull()
      expect(produtoNoBanco?.nome).toBe(nomeProduto)
      expect(produtoNoBanco?.quantidadeEstoque).toBe(50)
      expect(produtoNoBanco?.precoCusto).toBe(3550)
      expect(produtoNoBanco?.precoUnitario).toBe(6500)
    })

    it('deve permitir que um ADMIN também cadastre um produto', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const sku = `SKU-${randomUUID().substring(0, 8)}`
      const nomeProduto = `Óleo Sintético 5W30 - ${randomUUID().substring(0, 8)}`

      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: nomeProduto,
          tipo: 'INSUMO',
          marca: 'Castrol',
          codigoSKU: sku,
          precoCusto: 4000,
          precoUnitario: 7500,
          quantidadeEstoque: 100,
          unidadeMedida: 'L',
        }),
      })

      const body = await response.json() as { produto: ProdutoResponseDto }

      expect(response.status).toBe(201)
      expect(body.produto).toHaveProperty('id')

      const produtoNoBanco = await prisma.produto.findFirst({
        where: { id: body.produto.id },
      })

      expect(produtoNoBanco).not.toBeNull()
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar produto com SKU já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const skuDuplicado = `SKU-DUP-${randomUUID().substring(0, 8)}`

      // 1. Cria o primeiro produto diretamente na base
      await prisma.produto.create({
        data: {
          id: randomUUID(),
          nome: `Produto Existente - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: skuDuplicado,
          precoCusto: 2000,
          precoUnitario: 4000,
          quantidadeEstoque: 10,
        },
      })

      // 2. Tenta cadastrar outro produto com o mesmo SKU
      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: `Novo Produto - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: skuDuplicado,
          precoCusto: 3000,
          precoUnitario: 5000,
          quantidadeEstoque: 20,
        }),
      })

      expect(response.status).toBe(409)
    })

    it('deve retornar 403 (Forbidden) ao tentar cadastrar produto com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: `Produto Proibido - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          precoCusto: 1000,
          precoUnitario: 2000,
          quantidadeEstoque: 5,
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: `Produto Sem Token - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          precoCusto: 1000,
          precoUnitario: 2000,
          quantidadeEstoque: 5,
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})