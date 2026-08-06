import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { ServicoResponseDto } from '@/modules/os-orcamento/dto/servico/servico-response.dto.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Servico (E2E)', () => {
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

  describe('[POST] /servicos', () => {
    it('deve criar um serviço com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const nomeUnico = `Troca de Óleo - ${randomUUID().substring(0, 8)}`
      const payload = {
        nome: nomeUnico,
        categoria: 'MANUTENCAO_PREVENTIVA',
        descricao: 'Troca de óleo do motor e substituição do filtro',
        valorReferencia: 15000, // Preço em centavos ou formato configurado no projeto
      }

      // 1. Dispara a requisição HTTP POST
      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json() as { servico: ServicoResponseDto }

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('servico')
      expect(body.servico.nome).toBe(payload.nome)
      expect(body.servico.valorReferencia).toBe(payload.valorReferencia)

      // 2. Validação de persistência real no PostgreSQL
      const servicoNoBanco = await prisma.servico.findFirst({
        where: { nome: payload.nome },
      })

      expect(servicoNoBanco).not.toBeNull()
      expect(servicoNoBanco?.nome).toBe(payload.nome)
      expect(servicoNoBanco?.valorReferencia).toBe(payload.valorReferencia)
    })

    it('deve permitir que um ADMIN também crie um serviço', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const nomeUnico = `Alinhamento e Balanceamento - ${randomUUID().substring(0, 8)}`
      const payload = {
        nome: nomeUnico,
        categoria: 'MANUTENCAO_PREVENTIVA',
        descricao: 'Alinhamento 3D e balanceamento das 4 rodas',
        valorReferencia: 12000,
      }

      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('servico')

      const servicoNoBanco = await prisma.servico.findFirst({
        where: { nome: payload.nome },
      })

      expect(servicoNoBanco).not.toBeNull()
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar serviço com nome já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const nomeDuplicado = `Revisão Geral - ${randomUUID().substring(0, 8)}`
      const payload = {
        nome: nomeDuplicado,
        categoria: 'MANUTENCAO_PREVENTIVA',
        descricao: 'Checkup de 50 itens',
        valorReferencia: 35000,
      }

      // 1ª Criação (Sucesso)
      await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      // 2ª Criação com o mesmo nome (Falha por Conflito)
      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(409)
    })

    it('deve retornar 403 (Forbidden) ao tentar criar um serviço com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: `Serviço Proibido - ${randomUUID().substring(0, 8)}`,
          categoria: 'MANUTENCAO_PREVENTIVA',
          descricao: 'Descrição qualquer',
          valorReferencia: 10000,
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: `Serviço Sem Token - ${randomUUID().substring(0, 8)}`,
          categoria: 'MANUTENCAO_PREVENTIVA',
          descricao: 'Descrição qualquer',
          valorReferencia: 10000,
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})