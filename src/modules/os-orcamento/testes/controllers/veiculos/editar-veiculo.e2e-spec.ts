import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Editar Veiculo (E2E)', () => {
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

  describe('[PUT] /veiculos/:id', () => {
    it('deve editar um veículo com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um cliente e um veículo original no banco
      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `dono.edit.${randomUUID().substring(0, 8)}@example.com`,
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const veiculoId = randomUUID()
      const placaOriginal = `EDT${Math.floor(1000 + Math.random() * 9000)}`

      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          clienteId: clienteOriginal.getId().toValue(),
          placa: placaOriginal,
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2020,
          cor: 'Prata',
        },
      })

      const novaPlaca = `NEW${Math.floor(1000 + Math.random() * 9000)}`

      // 2. Dispara a requisição PUT de edição
      const response = await fetch(`${baseUrl}/veiculos/${veiculoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: clienteOriginal.getId().toValue(),
          placa: novaPlaca,
          marca: 'Toyota',
          modelo: 'Corolla Cross',
          ano: 2024,
          cor: 'Preto',
        }),
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('veiculo')
      expect(body.veiculo.placa).toBe(novaPlaca)
      expect(body.veiculo.modelo).toBe('Corolla Cross')
      expect(body.veiculo.ano).toBe(2024)

      // 3. Validação de persistência no PostgreSQL
      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      })

      expect(veiculoNoBanco).not.toBeNull()
      expect(veiculoNoBanco?.placa).toBe(novaPlaca)
      expect(veiculoNoBanco?.modelo).toBe('Corolla Cross')
      expect(veiculoNoBanco?.cor).toBe('Preto')
    })

    it('deve permitir que um ADMIN também edite um veículo', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `dono.admin.edit.${randomUUID().substring(0, 8)}@example.com`,
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const veiculoId = randomUUID()
      const placaOriginal = `ADM${Math.floor(1000 + Math.random() * 9000)}`

      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          clienteId: clienteOriginal.getId().toValue(),
          placa: placaOriginal,
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2021,
          cor: 'Cinza',
        },
      })

      const response = await fetch(`${baseUrl}/veiculos/${veiculoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: clienteOriginal.getId().toValue(),
          placa: placaOriginal,
          marca: 'Honda',
          modelo: 'Civic Touring',
          ano: 2022,
          cor: 'Branco',
        }),
      })

      expect(response.status).toBe(200)

      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      })

      expect(veiculoNoBanco?.modelo).toBe('Civic Touring')
      expect(veiculoNoBanco?.cor).toBe('Branco')
    })

    it('deve retornar 404 (Not Found) ao tentar editar um veículo inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const clienteOriginal = makeCliente()
      await prisma.cliente.create({
        data: {
          id: clienteOriginal.getId().toValue(),
          nome: clienteOriginal.getNome().getValor(),
          email: `dono.notfound.${randomUUID().substring(0, 8)}@example.com`,
          cpf: clienteOriginal.getCpf().getValor(),
          telefone: clienteOriginal.getTelefone().getValor(),
          tipo: clienteOriginal.getTipo(),
        },
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/veiculos/${idInexistente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: clienteOriginal.getId().toValue(),
          placa: `NOT${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Fiat',
          modelo: 'Palio',
          ano: 2015,
          cor: 'Vermelho',
        }),
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar editar com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/veiculos/${randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          placa: `FOR${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Ford',
          modelo: 'Fiesta',
          ano: 2018,
          cor: 'Azul',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/veiculos/${randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          placa: `UNAUTH${Math.floor(100 + Math.random() * 900)}`,
          marca: 'VW',
          modelo: 'Golf',
          ano: 2020,
          cor: 'Prata',
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})