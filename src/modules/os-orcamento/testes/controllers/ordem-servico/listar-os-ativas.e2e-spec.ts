import { randomUUID } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'
import { ListarOSAtivasController } from '@/modules/os-orcamento/controllers/ordem-servico/listar-os-ativas.controller.js'
import { ListarOSAtivasResponseDto } from '@/modules/os-orcamento/dto/ordem-servico/listar-os-ativas-response.dto.js'

describe('Listar Ordens de Serviço Ativas (E2E)', () => {
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

  describe('[GET] /ordens-servicos/ativas', () => {
    it('deve listar apenas ordens ativas com paginação e ordenação por prioridade', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const clienteId = randomUUID()
      const veiculoId = randomUUID()

      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Teste',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          documento: gerarCpf(),
          telefone: '11999999999',
          tipo: 'PF',
        },
      })

      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa: `ABC${Math.floor(1000 + Math.random() * 9000)}`,
          modelo: 'Civic',
          marca: 'Honda',
          ano: 2020,
          clienteId,
        },
      })

      await prisma.ordemServico.createMany({
        data: [
          {
            id: randomUUID(),
            clienteId,
            veiculoId,
            descricao: 'OS recebida',
            eGarantia: false,
            status: 'RECEBIDA',
          },
          {
            id: randomUUID(),
            clienteId,
            veiculoId,
            descricao: 'OS em execução',
            eGarantia: false,
            status: 'EM_EXECUCAO',
          },
          {
            id: randomUUID(),
            clienteId,
            veiculoId,
            descricao: 'OS autorizada',
            eGarantia: false,
            status: 'AUTORIZADA',
          },
          {
            id: randomUUID(),
            clienteId,
            veiculoId,
            descricao: 'OS encerrada',
            eGarantia: false,
            status: 'ENCERRADA',
          },
        ],
      })

      const response = await fetch(`${baseUrl}/ordens-servicos/ativas?pagina=1&limite=2`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarOSAtivasResponseDto

      expect(response.status).toBe(200)
      expect(body.ordensServicos).toHaveLength(2)
      expect(body.ordensServicos.map((ordemServico: { status: string }) => ordemServico.status))
        .toEqual(['EM_EXECUCAO', 'RECEBIDA'])
      expect(body.meta).toEqual({
        total: 3,
        pagina: 1,
        limite: 2,
        totalPaginas: 2,
      })
    })

    it('deve retornar 403 ao tentar acessar com o perfil CLIENTE', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'CLIENTE',
      })

      const response = await fetch(`${baseUrl}/ordens-servicos/ativas`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 quando nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/ordens-servicos/ativas`)

      expect(response.status).toBe(401)
    })
  })
})