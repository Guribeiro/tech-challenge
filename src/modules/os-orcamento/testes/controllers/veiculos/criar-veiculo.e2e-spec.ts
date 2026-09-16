import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Veiculo (E2E)', () => {
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

  describe('[POST] /veiculos', () => {
    it('deve criar um veículo com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um cliente prévio no banco para servir de proprietário
      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `dono.${randomUUID().substring(0, 8)}@example.com`,
          documento: clienteOriginal.getDocumento().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const clienteId = clienteOriginal.getId().toValue()
      const placaUnica = `ABC${Math.floor(1000 + Math.random() * 9000)}`

      const payload = {
        clienteId,
        placa: placaUnica,
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2022,
        cor: 'Prata',
      }

      // 2. Dispara a requisição HTTP POST
      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body).toHaveProperty('veiculo')
      expect(body.veiculo.placa).toBe(payload.placa)
      expect(body.veiculo.clienteId).toBe(clienteId)

      // 3. Validação de persistência real no PostgreSQL
      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: body.veiculo.id },
      })

      expect(veiculoNoBanco).not.toBeNull()
      expect(veiculoNoBanco?.placa).toBe(payload.placa)
      expect(veiculoNoBanco?.clienteId).toBe(clienteId)
    })

    it('deve permitir que um ADMIN também crie um veículo', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `dono.admin.${randomUUID().substring(0, 8)}@example.com`,
          documento: clienteOriginal.getDocumento().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const clienteId = clienteOriginal.getId().toValue()
      const placaUnica = `XYZ${Math.floor(1000 + Math.random() * 9000)}`

      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId,
          placa: placaUnica,
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2023,
          cor: 'Preto',
        }),
      })

      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body).toHaveProperty('veiculo')

      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: body.veiculo.id },
      })

      expect(veiculoNoBanco).not.toBeNull()
      expect(veiculoNoBanco?.placa).toBe(placaUnica)
    })

    it('deve retornar 404 (Not Found) se o clienteId informado não existir', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const clienteInexistenteId = randomUUID()

      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: clienteInexistenteId,
          placa: `NOT${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Ford',
          modelo: 'Ka',
          ano: 2020,
          cor: 'Branco',
        }),
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 409 (Conflict) ao tentar cadastrar veículo com placa já existente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `duplicado.${randomUUID().substring(0, 8)}@example.com`,
          documento: clienteOriginal.getDocumento().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const placaDuplicada = `DUP${Math.floor(1000 + Math.random() * 9000)}`
      const payload = {
        clienteId: clienteOriginal.getId().toValue(),
        placa: placaDuplicada,
        marca: 'Chevrolet',
        modelo: 'Onix',
        ano: 2021,
        cor: 'Cinza',
      }

      // 1ª Criação (Sucesso)
      await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      // 2ª Criação com a mesma placa (Falha por Conflito)
      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(409)
    })

    it('deve retornar 403 (Forbidden) ao tentar criar um veículo com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          placa: `FOR${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Fiat',
          modelo: 'Uno',
          ano: 2018,
          cor: 'Vermelho',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          placa: `UNAUTH${Math.floor(100 + Math.random() * 900)}`,
          marca: 'VW',
          modelo: 'Gol',
          ano: 2019,
          cor: 'Azul',
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})