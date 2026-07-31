import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { AppModule } from '@/infra/nest/app.module.js'
import { DatabaseModule } from '@/infra/database/database.module.js'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { makeOrdemServico } from '../../factories/make-ordem-servico.js'
import { makeOrcamento } from '../../factories/make-orcamento.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { randomUUID } from 'node:crypto'

describe('Aprovar Orçamento (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let baseUrl: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)

    await app.init()
    await app.listen(0)

    const address = app.getHttpServer().address()
    const port = typeof address === 'string' ? 0 : address.port
    baseUrl = `http://localhost:${port}`
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    DomainEvents.clearSubscribers()

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

  it('deve aprovar um orçamento com sucesso quando autenticado como o CLIENTE dono (204)', async () => {
    // 1. Cria o usuário autenticado e registra o cliente no banco
    const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
      role: 'CLIENTE',
    })

    const clienteDomain = makeCliente({}, new UniqueEntityID(usuario.id))
    await prisma.cliente.create({
      data: {
        id: clienteDomain.getId().toValue(),
        nome: clienteDomain.getNome().getValor(),
        email: clienteDomain.getEmail().getValor(),
        cpf: clienteDomain.getCpf().getValor(),
        telefone: clienteDomain.getTelefone().getValor(),
        tipo: clienteDomain.getTipo(),
      },
    })

    const veiculoDomain = makeVeiculo({ clienteId: clienteDomain.getId() })
    await prisma.veiculo.create({
      data: {
        id: veiculoDomain.getId().toValue(),
        placa: veiculoDomain.getPlaca().getValor(),
        modelo: veiculoDomain.getModelo(),
        marca: veiculoDomain.getMarca(),
        ano: veiculoDomain.getAno(),
        clienteId: veiculoDomain.getClienteId().toValue(),
      },
    })

    const osDomain = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      status: 'AGUARDANDO_APROVACAO',
    })
    await prisma.ordemServico.create({
      data: {
        id: osDomain.getId().toValue(),
        clienteId: osDomain.getClienteId().toValue(),
        veiculoId: osDomain.getVeiculoId().toValue(),
        status: osDomain.getStatus(),
        eGarantia: osDomain.getEGarantia(),
        descricao: osDomain.getDescricao(),
      },
    })

    // 2. Instancia via factory e persiste o orçamento no Prisma
    const orcamentoDomain = makeOrcamento({
      ordemServicoId: osDomain.getId(),
      clienteId: clienteDomain.getId(),
      status: 'ENVIADO',
    })

    await prisma.orcamento.create({
      data: {
        id: orcamentoDomain.getId().toValue(),
        ordemServicoId: orcamentoDomain.getOrdemServicoId().toValue(),
        clienteId: orcamentoDomain.getClienteId().toValue(),
        versao: orcamentoDomain.getVersao(),
        status: orcamentoDomain.getStatus(),
        descontoPorcentagem: orcamentoDomain.getDescontoPorcentagem(),
        criadoEm: orcamentoDomain.getCriadoEm(),
      },
    })

    // 3. Executa a requisição HTTP PATCH
    const response = await fetch(
      `${baseUrl}/orcamentos/${orcamentoDomain.getId().toValue()}/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    expect(response.status).toBe(204)

    // 4. Validação no banco de dados
    const orcamentoNoBanco = await prisma.orcamento.findUnique({
      where: { id: orcamentoDomain.getId().toValue() },
    })

    expect(orcamentoNoBanco?.status).toBe('APROVADO')
  })

  it('deve retornar 403 (AcessoNegadoError) ao tentar aprovar orçamento pertencente a outro cliente', async () => {
    // 1. Cliente 1: Dono real do orçamento
    const cliente1Domain = makeCliente()
    await prisma.cliente.create({
      data: {
        id: cliente1Domain.getId().toValue(),
        nome: cliente1Domain.getNome().getValor(),
        email: cliente1Domain.getEmail().getValor(),
        cpf: cliente1Domain.getCpf().getValor(),
        telefone: cliente1Domain.getTelefone().getValor(),
        tipo: cliente1Domain.getTipo(),
      },
    })

    const veiculoDomain = makeVeiculo({ clienteId: cliente1Domain.getId() })
    await prisma.veiculo.create({
      data: {
        id: veiculoDomain.getId().toValue(),
        placa: veiculoDomain.getPlaca().getValor(),
        modelo: veiculoDomain.getModelo(),
        marca: veiculoDomain.getMarca(),
        ano: veiculoDomain.getAno(),
        clienteId: veiculoDomain.getClienteId().toValue(),
      },
    })

    const osDomain = makeOrdemServico({
      clienteId: cliente1Domain.getId(),
      veiculoId: veiculoDomain.getId(),
    })
    await prisma.ordemServico.create({
      data: {
        id: osDomain.getId().toValue(),
        clienteId: osDomain.getClienteId().toValue(),
        veiculoId: osDomain.getVeiculoId().toValue(),
        status: osDomain.getStatus(),
        eGarantia: osDomain.getEGarantia(),
        descricao: osDomain.getDescricao(),
      },
    })

    const orcamentoDomain = makeOrcamento({
      ordemServicoId: osDomain.getId(),
      clienteId: cliente1Domain.getId(),
      status: 'ENVIADO',
    })
    await prisma.orcamento.create({
      data: {
        id: orcamentoDomain.getId().toValue(),
        ordemServicoId: orcamentoDomain.getOrdemServicoId().toValue(),
        clienteId: orcamentoDomain.getClienteId().toValue(),
        versao: orcamentoDomain.getVersao(),
        status: orcamentoDomain.getStatus(),
        descontoPorcentagem: orcamentoDomain.getDescontoPorcentagem(),
        criadoEm: orcamentoDomain.getCriadoEm(),
      },
    })

    // 2. Cliente 2: Autentica E cadastra na tabela de clientes
    const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
      role: 'CLIENTE',
    })

    const cliente2Domain = makeCliente({}, new UniqueEntityID(usuario.id))
    await prisma.cliente.create({
      data: {
        id: cliente2Domain.getId().toValue(),
        nome: cliente2Domain.getNome().getValor(),
        email: cliente2Domain.getEmail().getValor(),
        cpf: cliente2Domain.getCpf().getValor(),
        telefone: cliente2Domain.getTelefone().getValor(),
        tipo: cliente2Domain.getTipo(),
      },
    })

    // 3. Tenta aprovar o orçamento do Cliente 1 autenticado como Cliente 2
    const response = await fetch(
      `${baseUrl}/orcamentos/${orcamentoDomain.getId().toValue()}/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      statusCode: 403,
      error: 'AcessoNegadoError',
    })
  })

  it('deve retornar 403 (Forbidden) ao tentar aprovar como RECEPCAO (role não autorizada)', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'RECEPCAO',
    })

    const response = await fetch(
      `${baseUrl}/orcamentos/${randomUUID()}/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    expect(response.status).toBe(403)
  })

  it('deve retornar 404 (Not Found) ao tentar aprovar um orçamento inexistente', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'CLIENTE',
    })

    const response = await fetch(
      `${baseUrl}/orcamentos/${randomUUID()}/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'RecursoNaoEncontradoError',
    })
  })

  it('deve retornar 400 (Bad Request) se o ID do orçamento não for um UUID válido', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'CLIENTE',
    })

    const response = await fetch(
      `${baseUrl}/orcamentos/id-invalido/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    expect(response.status).toBe(400)
  })

  it('deve retornar 401 (Unauthorized) se não houver token de autenticação', async () => {
    const response = await fetch(
      `${baseUrl}/orcamentos/${randomUUID()}/aprovar-orcamento`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    expect(response.status).toBe(401)
  })
})