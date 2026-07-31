import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { generate as gerarCpf } from 'gerador-validador-cpf'

describe('Iniciar Diagnóstico de Ordem de Serviço (E2E)', () => {
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

  describe('[PATCH] /ordens-servicos/:ordemServicoId/iniciar-diagnostico', () => {
    it('deve iniciar o diagnóstico com sucesso quando autenticado como MECANICO', async () => {
      // 1. Autentica como MECANICO e obtém o usuário criado
      const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      // 2. Garante que o Mecânico exista na tabela 'mecanicos' vinculado ao ID do usuário autenticado
      await prisma.mecanico.create({
        data: {
          id: usuario.id,
          nome: 'Mecânico Teste',
          email: usuario.email,
          cpf: gerarCpf(),
        },
      })

      // 3. Prepara Cliente e Veículo prévios
      const clienteId = randomUUID()
      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Exemplo OS',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          cpf: gerarCpf(),
          telefone: '11999999999',
          tipo: 'PF',
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa: `ABC${Math.floor(1000 + Math.random() * 9000)}`,
          modelo: 'Corolla',
          marca: 'Toyota',
          ano: 2022,
          clienteId,
        },
      })

      // 4. Cria a Ordem de Serviço no status inicial (RECEBIDA)
      const ordemServicoId = randomUUID()
      await prisma.ordemServico.create({
        data: {
          id: ordemServicoId,
          clienteId,
          veiculoId,
          descricao: 'Barulho no motor ao desacelerar',
          eGarantia: false,
          status: 'RECEBIDA',
        },
      })

      // 5. Dispara a requisição PATCH
      const response = await fetch(
        `${baseUrl}/ordens-servicos/${ordemServicoId}/iniciar-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(204)

      // 6. Valida no PostgreSQL se o mecânico foi associado e o status atualizado
      const osAtualizada = await prisma.ordemServico.findUnique({
        where: { id: ordemServicoId },
      })

      expect(osAtualizada).not.toBeNull()
      expect(osAtualizada?.mecanicoId).toBe(usuario.id)
      expect(osAtualizada?.status).toBe('EM_DIAGNOSTICO')
    })

    it('deve retornar 404 (Not Found) se a Ordem de Serviço não existir', async () => {
      const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      await prisma.mecanico.create({
        data: {
          id: usuario.id,
          nome: 'Mecânico Teste',
          email: usuario.email,
          cpf: gerarCpf(),
        },
      })

      const ordemServicoInexistente = randomUUID()

      const response = await fetch(
        `${baseUrl}/ordens-servicos/${ordemServicoInexistente}/iniciar-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(404)
    })

    it('deve retornar 400 (Bad Request) se o ID da Ordem de Serviço for um UUID inválido', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'MECANICO',
      })

      const response = await fetch(
        `${baseUrl}/ordens-servicos/id-invalido-123/iniciar-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(400)
    })

    it('deve retornar 403 (Forbidden) se tentar iniciar o diagnóstico com perfil RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const response = await fetch(
        `${baseUrl}/ordens-servicos/${randomUUID()}/iniciar-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      expect(response.status).toBe(403)
    })

    it('deve retornar 401 (Unauthorized) se não enviar o token JWT', async () => {
      const response = await fetch(
        `${baseUrl}/ordens-servicos/${randomUUID()}/iniciar-diagnostico`,
        {
          method: 'PATCH',
        },
      )

      expect(response.status).toBe(401)
    })
  })
})