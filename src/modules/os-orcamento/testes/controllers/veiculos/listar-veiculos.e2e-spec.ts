import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'
import { ListarVeiculosResponseDto } from '@/modules/os-orcamento/dto/veiculo/listar-veiculos-response.dto.js'

describe('Listar Veiculos (E2E)', () => {
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

  describe('[GET] /veiculos', () => {
    it('deve listar veículos com paginação e meta dados com sucesso', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Prepara dados no banco: 1 Cliente e 3 Veículos
      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: `dono.lst.${randomUUID().substring(0, 8)}@example.com`,
          cpf: cliente.getCpf().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const clienteId = cliente.getId().toValue()

      await prisma.veiculo.createMany({
        data: [
          {
            id: randomUUID(),
            clienteId,
            placa: `LST${Math.floor(1000 + Math.random() * 9000)}`,
            marca: 'Toyota',
            modelo: 'Corolla',
            ano: 2021,
            cor: 'Preto',
          },
          {
            id: randomUUID(),
            clienteId,
            placa: `LST${Math.floor(1000 + Math.random() * 9000)}`,
            marca: 'Honda',
            modelo: 'Civic',
            ano: 2022,
            cor: 'Branco',
          },
          {
            id: randomUUID(),
            clienteId,
            placa: `LST${Math.floor(1000 + Math.random() * 9000)}`,
            marca: 'Ford',
            modelo: 'Focus',
            ano: 2020,
            cor: 'Cinza',
          },
        ],
      })

      // 2. Dispara a requisição solicitando página 1 com limite de 2 itens
      const response = await fetch(`${baseUrl}/veiculos?pagina=1&limite=2`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarVeiculosResponseDto

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('veiculos')
      expect(body).toHaveProperty('meta')
      expect(body.veiculos).toHaveLength(2)
      expect(body.meta).toEqual({
        total: 3,
        pagina: 1,
        limite: 2,
        totalPaginas: 2,
      })
    })

    it('deve permitir que um ADMIN solicite a lista de veículos', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: `dono.admin.lst.${randomUUID().substring(0, 8)}@example.com`,
          cpf: cliente.getCpf().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      await prisma.veiculo.create({
        data: {
          id: randomUUID(),
          clienteId: cliente.getId().toValue(),
          placa: `ADM${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Chevrolet',
          modelo: 'Cruze',
          ano: 2023,
          cor: 'Prata',
        },
      })

      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarVeiculosResponseDto

      expect(response.status).toBe(200)
      expect(body.veiculos).toHaveLength(1)
      expect(body.meta.total).toBe(1)
    })

    it('deve filtrar veículos respeitando o parâmetro de query de status', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: `dono.status.${randomUUID().substring(0, 8)}@example.com`,
          cpf: cliente.getCpf().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const clienteId = cliente.getId().toValue()

      // Veículo ativo
      await prisma.veiculo.create({
        data: {
          id: randomUUID(),
          clienteId,
          placa: `ACT${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Fiat',
          modelo: 'Argo',
          ano: 2022,
          cor: 'Vermelho',
          deletadoEm: null,
        },
      })

      // Veículo inativo (soft-deleted)
      await prisma.veiculo.create({
        data: {
          id: randomUUID(),
          clienteId,
          placa: `INA${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Fiat',
          modelo: 'Mobi',
          ano: 2021,
          cor: 'Branco',
          deletadoEm: new Date(),
        },
      })

      const response = await fetch(`${baseUrl}/veiculos?status=ativos`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const body = await response.json() as ListarVeiculosResponseDto

      expect(response.status).toBe(200)
      expect(body.veiculos).toHaveLength(1)
      expect(body.veiculos[0].modelo).toBe('Argo')
    })

    it('deve retornar 403 (Forbidden) ao tentar listar veículos com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/veiculos`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })
})