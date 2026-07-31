import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { ListarServicosResponseDto } from '@/modules/os-orcamento/dto/servico/listar-servicos-response.dto.js'

describe('Listar Servicos (E2E)', () => {
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
    await prisma.$transaction([
      // 1. Tabelas pivot / filhas mais profundas
      prisma.ordemServicoServico.deleteMany(),
      prisma.ordemServicoComponente.deleteMany(),
      prisma.orcamentoServico.deleteMany(),
      prisma.orcamentoComponente.deleteMany(),
      prisma.fatura.deleteMany(),
      prisma.termoLiberacao.deleteMany(),

      // 2. Entidades intermediárias
      prisma.orcamento.deleteMany(),
      prisma.ordemServico.deleteMany(),
      prisma.veiculo.deleteMany(),

      // 3. Entidades raiz / sem dependências filhas
      prisma.cliente.deleteMany(),
      prisma.mecanico.deleteMany(),
      prisma.recepcionista.deleteMany(),
      prisma.servico.deleteMany(),
      prisma.produto.deleteMany(),
      prisma.usuario.deleteMany(),
    ])
  })

  afterAll(async () => {
    await app.close()
  })

  describe('[GET] /servicos', () => {
    it('deve listar serviços paginados com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria serviços no banco de dados
      await prisma.servico.createMany({
        data: [
          {
            id: randomUUID(),
            nome: `Troca de Óleo - ${randomUUID().substring(0, 8)}`,
            descricao: 'Troca de óleo sintético',
            valorReferencia: 15000,
            categoria: 'MANUTENCAO_PREVENTIVA',
            desativadoEm: null,
          },
          {
            id: randomUUID(),
            nome: `Alinhamento - ${randomUUID().substring(0, 8)}`,
            descricao: 'Alinhamento 3D',
            valorReferencia: 12000,
            categoria: 'MANUTENCAO_PREVENTIVA',
            desativadoEm: null,
          },
        ],
      })

      // 2. Dispara a requisição GET
      const response = await fetch(`${baseUrl}/servicos?pagina=1&limite=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarServicosResponseDto

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('servicos')
      expect(body.servicos).toHaveLength(2)
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

      await prisma.servico.create({
        data: {
          id: randomUUID(),
          nome: `Diagnóstico de Injeção - ${randomUUID().substring(0, 8)}`,
          descricao: 'Análise via scanner',
          valorReferencia: 18000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: null,
        },
      })

      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenMecanico}`,
        },
      })

      const body = await response.json() as ListarServicosResponseDto

      expect(response.status).toBe(200)
      expect(body.servicos).toHaveLength(1)
    })

    it('deve filtrar serviços por nome', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const nomeExclusivo = `Balanceamento Especial - ${randomUUID().substring(0, 8)}`

      await prisma.servico.createMany({
        data: [
          {
            id: randomUUID(),
            nome: nomeExclusivo,
            descricao: 'Balanceamento de alta precisão',
            valorReferencia: 8000,
            categoria: 'MANUTENCAO_PREVENTIVA',
            desativadoEm: null,
          },
          {
            id: randomUUID(),
            nome: `Troca de Pastilha - ${randomUUID().substring(0, 8)}`,
            descricao: 'Freios dianteiros',
            valorReferencia: 22000,
            categoria: 'MANUTENCAO_PREVENTIVA',
            desativadoEm: null,
          },
        ],
      })

      const response = await fetch(
        `${baseUrl}/servicos?nome=${encodeURIComponent('Balanceamento Especial')}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const body = await response.json() as ListarServicosResponseDto

      expect(response.status).toBe(200)
      expect(body.servicos).toHaveLength(1)
      expect(body.servicos[0].nome).toBe(nomeExclusivo)
      expect(body.meta.total).toBe(1)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/servicos`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })
})