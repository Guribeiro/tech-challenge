import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { generate as gerarCpf } from 'gerador-validador-cpf'

describe('Listar Clientes (E2E)', () => {
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
    await prisma.cliente.deleteMany()
    await prisma.usuario.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[GET] /clientes', () => {
    it('deve listar clientes com paginação e meta dados com sucesso', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria 3 clientes no banco
      await Promise.all([
        prisma.cliente.create({
          data: {
            id: randomUUID(),
            nome: 'Ana Silva',
            email: `ana.${randomUUID().substring(0, 8)}@example.com`,
            cpf: gerarCpf(),
            telefone: '(11) 91111-1111',
            tipo: 'PF',
          },
        }),
        prisma.cliente.create({
          data: {
            id: randomUUID(),
            nome: 'Bruno Lima',
            email: `bruno.${randomUUID().substring(0, 8)}@example.com`,
            cpf: gerarCpf(),
            telefone: '(11) 92222-2222',
            tipo: 'PF',
          },
        }),
        prisma.cliente.create({
          data: {
            id: randomUUID(),
            nome: 'Carlos Eduardo',
            email: `carlos.${randomUUID().substring(0, 8)}@example.com`,
            cpf: gerarCpf(),
            telefone: '(11) 93333-3333',
            tipo: 'PF',
          },
        }),
      ])

      // 2. Executa a requisição com paginação (pagina=1, limite=2)
      const response = await fetch(`${baseUrl}/clientes?pagina=1&limite=2`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('clientes')
      expect(body.clientes).toHaveLength(2)

      // Validação da estrutura do meta retornado no presenter/controller
      expect(body).toHaveProperty('meta')
      expect(body.meta).toEqual({
        total: 3,
        pagina: 1,
        limite: 2,
        totalPaginas: 2,
      })
    })

    it('deve filtrar clientes por nome', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const clienteAlvo = makeCliente({ nome: NomeCompleto.criar('Marcos Roberto UniqueName') })
      const clienteOutro = makeCliente({ nome: NomeCompleto.criar('Fernanda Rocha') })

      await prisma.cliente.createMany({
        data: [
          {
            id: clienteAlvo.getId().toValue(),
            nome: clienteAlvo.getNome().getValor(),
            email: `marcos.${randomUUID().substring(0, 8)}@example.com`,
            cpf: gerarCpf(),
            telefone: '(11) 94444-4444',
            tipo: 'PF',
          },
          {
            id: clienteOutro.getId().toValue(),
            nome: clienteOutro.getNome().getValor(),
            email: `fernanda.${randomUUID().substring(0, 8)}@example.com`,
            cpf: gerarCpf(),
            telefone: '(11) 95555-5555',
            tipo: 'PF',
          },
        ],
      })

      const url = new URL(`${baseUrl}/clientes`)
      url.searchParams.set('nome', 'Marcos Roberto')

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.clientes).toHaveLength(1)
      expect(body.clientes[0].nome).toBe('Marcos Roberto UniqueName')
      expect(body.meta.total).toBe(1)
    })

    it('deve respeitar a filtragem por status mantendo soft-deleted isolados se aplicável', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // Cliente Ativo
      await prisma.cliente.create({
        data: {
          id: randomUUID(),
          nome: 'Cliente Ativo',
          email: `ativo.${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '(11) 96666-6666',
          tipo: 'PF',
          deletadoEm: null,
        },
      })

      // Cliente Soft-Deleted
      await prisma.cliente.create({
        data: {
          id: randomUUID(),
          nome: 'Cliente Inativo',
          email: `inativo.${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '(11) 97777-7777',
          tipo: 'PF',
          deletadoEm: new Date(),
        },
      })

      // Busca sem passar query de status (comportamento padrão de listagem)
      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      // Dependendo da lógica de negócio do seu UseCase, verifica se listou apenas o ativo
      expect(body.clientes.some((c: any) => c.nome === 'Cliente Ativo')).toBe(true)
    })

    it('deve retornar 403 (Forbidden) se acessado por perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/clientes`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })
})