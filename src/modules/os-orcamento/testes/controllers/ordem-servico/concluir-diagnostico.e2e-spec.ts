import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { randomUUID } from 'node:crypto'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { DomainEvents } from '@/core/events/domain-events.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'

describe('Concluir Diagnóstico de Ordem de Serviço (E2E)', () => {
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
    // 1. Desconecta temporariamente ou limpa os subscribers estáticos
    // para garantir que nenhum evento pendente rode durante a limpeza
    DomainEvents.clearSubscribers()

    // 2. Limpa o banco com CASCADE em uma única string SQL
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "ordem_servico_servicos",
      "ordem_servico_componentes",
      "orcamento_servicos",
      "orcamento_componentes",
      "faturas",
      "termo_liberacoes",
      "orcamentos",
      "ordem_servicos",
      "veiculos",
      "clientes",
      "mecanicos",
      "recepcionistas",
      "servicos",
      "produtos",
      "usuarios"
    RESTART IDENTITY CASCADE;
  `)
  })
  afterAll(async () => {
    await app.close()
  })

  describe('[PATCH] /ordens-servicos/:ordemServicoId/concluir-diagnostico', () => {
    it('deve concluir o diagnóstico com sucesso quando autenticado como MECANICO responsável', async () => {
      // 1. Autentica como MECANICO e garante a existência no cadastro de mecânicos
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

      // 2. Prepara Cliente e Veículo
      const clienteId = randomUUID()
      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Exemplo Diagnóstico',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          documento: gerarCpf(),
          telefone: '11999999999',
          tipo: 'PF',
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa: makeVeiculo().getPlaca().getValor(),
          modelo: 'Golf',
          marca: 'Volkswagen',
          ano: 2021,
          clienteId,
        },
      })

      // 3. Prepara Serviço e Produto diagnosticados
      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Alinhamento e Balanceamento - ${randomUUID().substring(0, 8)}`,
          descricao: 'Ajuste de geometria das rodas',
          valorReferencia: 12000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Pastilha de Freio - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 5000,
          precoUnitario: 10000,
          quantidadeEstoque: 15,
        },
      })

      // 4. Cria a OS em estado EM_DIAGNOSTICO vinculada ao mesmo mecânico
      const ordemServicoId = randomUUID()
      await prisma.ordemServico.create({
        data: {
          id: ordemServicoId,
          clienteId,
          veiculoId,
          mecanicoId: usuario.id,
          descricao: 'Ruído ao frear',
          eGarantia: false,
          status: 'EM_DIAGNOSTICO',
        },
      })

      // 5. Executa a requisição de conclusão do diagnóstico
      const response = await fetch(
        `${baseUrl}/ordens-servicos/${ordemServicoId}/concluir-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            servicos: [{ servicoId }],
            componentes: [{ produtoId, quantidade: 2 }],
          }),
        },
      )

      expect(response.status).toBe(204)

      // 6. Verifica a inclusão dos serviços e componentes vinculados à OS no banco
      const servicosOS = await prisma.ordemServicoServico.findMany({
        where: { ordemServicoId },
      })
      const componentesOS = await prisma.ordemServicoComponente.findMany({
        where: { ordemServicoId },
      })

      expect(servicosOS).toHaveLength(1)
      expect(servicosOS[0].servicoId).toBe(servicoId)

      expect(componentesOS).toHaveLength(1)
      expect(componentesOS[0].produtoId).toBe(produtoId)
      expect(componentesOS[0].quantidade).toBe(2)
    })

    it('deve concluir o diagnóstico com sucesso quando autenticado como ADMIN (Gestor)', async () => {
      const { accessToken: tokenAdmin } = await makeUsuarioAutenticado(app, {
        role: 'ADMIN',
      })

      const clienteId = randomUUID()
      await prisma.cliente.create({
        data: {
          id: clienteId,
          nome: 'Cliente Admin OS',
          email: `cliente-${randomUUID().substring(0, 8)}@example.com`,
          documento: gerarCpf(),
          telefone: '11988888888',
          tipo: 'PF',
        },
      })

      const veiculoId = randomUUID()
      await prisma.veiculo.create({
        data: {
          id: veiculoId,
          placa: `XYZ${Math.floor(1000 + Math.random() * 9000)}`,
          modelo: 'Onix',
          marca: 'Chevrolet',
          ano: 2023,
          clienteId,
        },
      })

      const ordemServicoId = randomUUID()
      await prisma.ordemServico.create({
        data: {
          id: ordemServicoId,
          clienteId,
          veiculoId,
          descricao: 'Troca de lâmpadas queimadas',
          eGarantia: false,
          status: 'EM_DIAGNOSTICO',
        },
      })

      const servicoId = randomUUID()
      await prisma.servico.create({
        data: {
          id: servicoId,
          nome: `Alinhamento e Balanceamento - ${randomUUID().substring(0, 8)}`,
          descricao: 'Ajuste de geometria das rodas',
          valorReferencia: 12000,
          categoria: 'MANUTENCAO_PREVENTIVA',
        },
      })

      const produtoId = randomUUID()
      await prisma.produto.create({
        data: {
          id: produtoId,
          nome: `Pastilha de Freio - ${randomUUID().substring(0, 8)}`,
          tipo: 'PECA',
          codigoSKU: `SKU-${randomUUID().substring(0, 8)}`,
          precoCusto: 5000,
          precoUnitario: 10000,
          quantidadeEstoque: 15,
        },
      })

      const response = await fetch(
        `${baseUrl}/ordens-servicos/${ordemServicoId}/concluir-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAdmin}`,
          },
          body: JSON.stringify({
            servicos: [{ servicoId }],
            componentes: [{ produtoId, quantidade: 2 }],
          }),
        },
      )

      expect(response.status).toBe(204)
    })

    it('deve retornar 403 (Forbidden) ao tentar concluir diagnóstico autenticado como RECEPCAO', async () => {
      const { accessToken } = await makeUsuarioAutenticado(app, {
        role: 'RECEPCAO',
      })

      const response = await fetch(
        `${baseUrl}/ordens-servicos/${randomUUID()}/concluir-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            servicos: [],
            componentes: [],
          }),
        },
      )

      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body).toMatchObject({
        statusCode: 403,
        error: 'Forbidden',
      })
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

      const response = await fetch(
        `${baseUrl}/ordens-servicos/${randomUUID()}/concluir-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            servicos: [],
            componentes: [],
          }),
        },
      )

      expect(response.status).toBe(404)
    })

    it('deve retornar 401 (Unauthorized) se o token de autenticação não for fornecido', async () => {
      const response = await fetch(
        `${baseUrl}/ordens-servicos/${randomUUID()}/concluir-diagnostico`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            servicos: [],
            componentes: [],
          }),
        },
      )

      expect(response.status).toBe(401)
    })
  })
})