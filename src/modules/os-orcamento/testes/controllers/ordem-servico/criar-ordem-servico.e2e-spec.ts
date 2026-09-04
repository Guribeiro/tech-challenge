import { randomUUID } from 'node:crypto'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { OrdemServicoResponseDto } from '@/modules/os-orcamento/dto/ordem-servico/ordem-servico-response.dto.js'
import { resetDatabase } from '@/teste/helpers/reset-database.js'

describe('Criar Ordem de Serviço (E2E)', () => {
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

  describe('[POST] /ordens-servicos', () => {
    it('deve abrir uma nova ordem de serviço com sucesso quando autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      // 1. Cria o cliente na tabela 'cliente' (e não em 'usuario')
      const clienteId = randomUUID()
      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Teste OS',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          documento: gerarCpf(),
          telefone: '11999999999',
          tipo: 'PF',
        },
      })

      // 2. Cria o veículo associado ao cliente recém-criado
      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa: `ABC${Math.floor(1000 + Math.random() * 9000)}`,
          modelo: 'Civic',
          marca: 'Honda',
          ano: 2020,
          clienteId, // Agora o clienteId existe na tabela 'clientes'!
        },
      })

      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Troca de Óleo - ${randomUUID().substring(0, 8)}`,
          descricao: 'Troca de óleo sintético',
          valorReferencia: 15000,
          categoria: 'MANUTENCAO_PREVENTIVA',
          desativadoEm: null,
        },
      })

      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Filtro de Óleo - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 3000,
          precoUnitario: 6000,
          quantidadeEstoque: 20,
          desativadoEm: null,
        },
      })

      // 3. Dispara a requisição POST
      const response = await fetch(`${baseUrl}/ordens-servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId,
          veiculoId,
          descricao: 'Revisão periódica com troca de óleo e filtro.',
          eGarantia: false,
          servicos: [{ servicoId }],
          componentes: [{ produtoId, quantidade: 2 }],
        }),
      })

      const body = await response.json() as OrdemServicoResponseDto

      expect(response.status).toBe(201)
      expect(body).toHaveProperty('id')

      // 4. Valida no banco
      const osNoBanco = await prisma.ordemServico.findUnique({
        where: { id: body.id },
      })

      expect(osNoBanco).not.toBeNull()
      expect(osNoBanco?.clienteId).toBe(clienteId)
      expect(osNoBanco?.veiculoId).toBe(veiculoId)
    })

    it('deve retornar 404 (Not Found) se o veículo ou cliente fornecido não existir', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const clienteInexistente = randomUUID()
      const veiculoInexistente = randomUUID()

      const response = await fetch(`${baseUrl}/ordens-servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clienteId: clienteInexistente,
          veiculoId: veiculoInexistente,
          descricao: 'Tentativa com IDs inválidos',
          eGarantia: false,
        }),
      })

      expect(response.status).toBe(404)
    })

    it('deve retornar 403 (Forbidden) ao tentar abrir ordem de serviço com perfil ADMIN ou MECANICO', async () => {
      const { accessToken: tokenAdmin } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const response = await fetch(`${baseUrl}/ordens-servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          veiculoId: randomUUID(),
          descricao: 'Abertura por perfil não autorizado',
          eGarantia: false,
        }),
      })

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se nenhum token JWT for fornecido', async () => {
      const response = await fetch(`${baseUrl}/ordens-servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: randomUUID(),
          veiculoId: randomUUID(),
          descricao: 'Sem token',
          eGarantia: false,
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})