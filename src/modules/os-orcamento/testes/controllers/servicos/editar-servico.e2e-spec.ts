import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { ServicoResponseDto } from '@/modules/os-orcamento/dto/servico/servico-response.dto.js'

describe('Editar Servico (E2E)', () => {
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

  describe('[PUT] /servicos/:id', () => {
    it('deve editar um serviço com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria um serviço original no banco
      const servicoId = randomUUID()
      const nomeOriginal = `Alinhamento - ${randomUUID().substring(0, 8)}`

      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: nomeOriginal,
          descricao: 'Alinhamento simples',
          valorReferencia: 10000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      const novoNome = `Alinhamento 3D - ${randomUUID().substring(0, 8)}`

      // 2. Dispara a requisição PUT de edição
      const response = await fetch(`${baseUrl}/servicos/${servicoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: novoNome,
          descricao: 'Alinhamento 3D computadorizado de alta precisão',
          valorReferencia: 15000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        }),
      })

      const body = await response.json() as { servico: ServicoResponseDto }

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('servico')
      expect(body.servico.nome).toBe(novoNome)
      expect(body.servico.valorReferencia).toBe(15000)

      // 3. Validação de persistência real no PostgreSQL
      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco).not.toBeNull()
      expect(servicoNoBanco?.nome).toBe(novoNome)
      expect(servicoNoBanco?.valorReferencia).toBe(15000)
      expect(servicoNoBanco?.categoria).toBe('MANUTENCAO_PREVENTIVA')
    })

    it('deve permitir que um ADMIN também edite um serviço', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const servicoId = randomUUID()
      const nomeOriginal = `Troca de Filtro - ${randomUUID().substring(0, 8)}`

      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: nomeOriginal,
          descricao: 'Substituição do filtro de ar',
          valorReferencia: 5000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      const response = await fetch(`${baseUrl}/servicos/${servicoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: nomeOriginal,
          descricao: 'Substituição do filtro de ar e higienização',
          valorReferencia: 8000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        }),
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('servico')

      const servicoNoBanco = await prisma.servico.findUnique({
        where: { id: servicoId },
      })

      expect(servicoNoBanco?.valorReferencia).toBe(8000)
    })

    it('deve retornar 409 (Conflict) ao tentar editar o nome do serviço para um nome já em uso', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const nomeExistente = `Balanceamento - ${randomUUID().substring(0, 8)}`
      const nomeOutroServico = `Troca de Freios - ${randomUUID().substring(0, 8)}`

      // Cria o 1º serviço
      await prisma.servico.create({
        data: {
          id: randomUUID(),
          nome: nomeExistente,
          descricao: 'Balanceamento de rodas',
          valorReferencia: 8000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      // Cria o 2º serviço que tentaremos editar para usar o nome do 1º
      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: nomeOutroServico,
          descricao: 'Troca de pastilhas de freio',
          valorReferencia: 20000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      const response = await fetch(`${baseUrl}/servicos/${servicoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: nomeExistente, // Tentando usar o nome que já existe no 1º serviço
          descricao: 'Troca de pastilhas de freio',
          valorReferencia: 20000,
          categoria: 'FREIOS',
        }),
      })

      expect(response.status).toBe(409)
    })

    it('deve retornar 404 (Not Found) ao tentar editar um serviço inexistente', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/servicos/${idInexistente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: `Serviço Inexistente - ${randomUUID().substring(0, 8)}`,
          descricao: 'Descrição qualquer',
          valorReferencia: 10000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        }),
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar editar serviço com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nome: `Edição Não Autorizada - ${randomUUID().substring(0, 8)}`,
          descricao: 'Descrição',
          valorReferencia: 10000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/servicos/${randomUUID()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: `Edição Sem Token - ${randomUUID().substring(0, 8)}`,
          descricao: 'Descrição',
          valorReferencia: 10000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})