import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { DomainEvents } from '@/core/events/domain-events.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Consultar Situação OS Público (E2E)', () => {
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
    DomainEvents.clearSubscribers()

    await resetDatabase(prisma)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[GET] /ordens-servicos/rastreio', () => {
    it('deve retornar a situação da ordem de serviço com sucesso quando a placa e o documento forem válidos', async () => {
      const documento = gerarCpf()
      const placa = makeVeiculo().getPlaca().getValor()

      const clienteId = randomUUID()
      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Rastreio',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          documento,
          telefone: '11999999999',
          tipo: 'PF',
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa,
          modelo: 'Civic',
          marca: 'Honda',
          ano: 2022,
          clienteId,
        },
      })

      const ordemServicoId = randomUUID()
      await prisma.ordemServico.create({
        data: {
          id: ordemServicoId,
          clienteId,
          veiculoId,
          descricao: 'Revisão periódica',
          eGarantia: false,
          status: 'RECEBIDA',
        },
      })

      const response = await fetch(
        `${baseUrl}/ordens-servicos/rastreio?placa=${placa}&documento=${documento}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual(
        expect.objectContaining({
          id: ordemServicoId,
          descricao: 'Revisão periódica',
          status: 'RECEBIDA',
        }),
      )
    })

    it('deve retornar 404 (Not Found) quando os dados informados não forem encontrados', async () => {
      const response = await fetch(
        `${baseUrl}/ordens-servicos/rastreio?placa=XYZ9999&documento=00000000000`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      expect(response.status).toBe(404)
    })
  })
})