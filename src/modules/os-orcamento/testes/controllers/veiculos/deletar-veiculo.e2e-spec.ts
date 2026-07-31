import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { randomUUID } from 'node:crypto'

describe('Deletar Veiculo (E2E)', () => {
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

  describe('[DELETE] /veiculos/:id', () => {
    it('deve realizar soft-delete do veículo com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Persiste o cliente e o veículo no banco (inicialmente ativo com deletadoEm = null)
      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: `dono.del.${randomUUID().substring(0, 8)}@example.com`,
          cpf: cliente.getCpf().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          clienteId: cliente.getId().toValue(),
          placa: `DEL${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Chevrolet',
          modelo: 'Tracker',
          ano: 2022,
          cor: 'Cinza',
          deletadoEm: null,
        },
      })

      // 2. Dispara a requisição DELETE
      const response = await fetch(`${baseUrl}/veiculos/${veiculoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      // 3. Valida a persistência do Soft-Delete no PostgreSQL (Registro existe, mas deletadoEm !== null)
      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      })

      expect(veiculoNoBanco).not.toBeNull()
      expect(veiculoNoBanco?.deletadoEm).not.toBeNull()
      expect(veiculoNoBanco?.deletadoEm).toBeInstanceOf(Date)
    })

    it('deve permitir que um ADMIN também realize o soft-delete do veículo', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const cliente = makeCliente()
      await prisma.cliente.create({
        data: {
          id: cliente.getId().toValue(),
          nome: cliente.getNome().getValor(),
          email: `dono.admin.del.${randomUUID().substring(0, 8)}@example.com`,
          cpf: cliente.getCpf().getValor(),
          telefone: cliente.getTelefone().getValor(),
          tipo: cliente.getTipo(),
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          clienteId: cliente.getId().toValue(),
          placa: `ADM${Math.floor(1000 + Math.random() * 9000)}`,
          marca: 'Renault',
          modelo: 'Duster',
          ano: 2021,
          cor: 'Preto',
          deletadoEm: null,
        },
      })

      const response = await fetch(`${baseUrl}/veiculos/${veiculoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(200)

      const veiculoNoBanco = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      })

      expect(veiculoNoBanco?.deletadoEm).not.toBeNull()
    })

    it('deve retornar 404 (Not Found) ao tentar deletar um veículo que não existe', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const idInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/veiculos/${idInexistente}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar deletar veículo com perfil não autorizado (ex: MECANICO)', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(`${baseUrl}/veiculos/${randomUUID()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/veiculos/${randomUUID()}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
})