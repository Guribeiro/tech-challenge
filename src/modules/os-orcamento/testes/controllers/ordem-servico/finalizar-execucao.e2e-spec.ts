import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { AppModule } from '@/infra/nest/app.module.js'
import { DatabaseModule } from '@/infra/database/database.module.js'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { makeCliente } from '../../factories/make-cliente.js'
import { makeVeiculo } from '../../factories/make-veiculo.js'
import { makeOrdemServico } from '../../factories/make-ordem-servico.js'
import { DomainEvents } from '@/core/events/domain-events.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { randomUUID } from 'node:crypto'
import { generate as gerarCpf } from 'gerador-validador-cpf'

describe('Finalizar Execução (E2E)', () => {
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

  it('deve finalizar a execução da ordem de serviço com sucesso quando autenticado como o MECANICO responsável (204)', async () => {
    // 1. Cria usuário MECANICO
    const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })

    await prisma.mecanico.create({
      data: {
        id: usuario.id,
        nome: 'Mecânico Responsável',
        especialidade: 'GERAL',
        cpf: gerarCpf(),
        email: makeCliente().getEmail().getValor()
      },
    })

    const clienteDomain = makeCliente()
    await prisma.cliente.create({
      data: {
        id: clienteDomain.getId().toValue(),
        nome: clienteDomain.getNome().getValor(),
        email: clienteDomain.getEmail().getValor(),
        documento: clienteDomain.getDocumento().getValor(),
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

    // Atribui o mecânico como dono da OS e define status EM_EXECUCAO
    const osDomain = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      mecanicoId: new UniqueEntityID(usuario.id),
      status: 'EM_EXECUCAO',
    })
    await prisma.ordemServico.create({
      data: {
        id: osDomain.getId().toValue(),
        clienteId: osDomain.getClienteId().toValue(),
        veiculoId: osDomain.getVeiculoId().toValue(),
        mecanicoId: osDomain.getMecanicoId()?.toValue(),
        status: osDomain.getStatus(),
        eGarantia: osDomain.getEGarantia(),
        descricao: osDomain.getDescricao(),
      },
    })

    // 2. Executa a requisição HTTP PATCH
    const response = await fetch(
      `${baseUrl}/ordens-servicos/${osDomain.getId().toValue()}/finalizar-execucao`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    expect(response.status).toBe(204)

    // 3. Validação no banco de dados
    const osNoBanco = await prisma.ordemServico.findUnique({
      where: { id: osDomain.getId().toValue() },
    })

    expect(osNoBanco?.status).toBe('FINALIZADA') // Ajuste conforme a regra de transição do seu domínio (ou CONCLUIDA, etc)
  })

  it('deve retornar 403 (AcessoNegadoError) se um mecânico diferente tentar finalizar a execução de uma OS que não é sua', async () => {
    // Mecânico 1: Dono da OS
    const mecanico1Id = randomUUID()
    await prisma.usuario.create({
      data: {
        id: mecanico1Id,
        email: 'mecanico1@test.com',
        senhaHash: 'hash',
        role: 'MECANICO',
      },
    })
    await prisma.mecanico.create({
      data: {
        id: mecanico1Id,
        nome: 'Mecânico 1',
        especialidade: 'GERAL',
        cpf: gerarCpf(),
        email: makeCliente().getEmail().getValor()
      },
    })

    const clienteDomain = makeCliente()
    await prisma.cliente.create({
      data: {
        id: clienteDomain.getId().toValue(),
        nome: clienteDomain.getNome().getValor(),
        email: clienteDomain.getEmail().getValor(),
        documento: clienteDomain.getDocumento().getValor(),
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
      mecanicoId: new UniqueEntityID(mecanico1Id),
      status: 'EM_EXECUCAO',
    })
    await prisma.ordemServico.create({
      data: {
        id: osDomain.getId().toValue(),
        clienteId: osDomain.getClienteId().toValue(),
        veiculoId: osDomain.getVeiculoId().toValue(),
        mecanicoId: osDomain.getMecanicoId()?.toValue(),
        status: osDomain.getStatus(),
        eGarantia: osDomain.getEGarantia(),
        descricao: osDomain.getDescricao(),
      },
    })

    // Mecânico 2: Usuário autenticado tentando finalizar
    const { accessToken, usuario: usuario2 } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })
    await prisma.mecanico.create({
      data: {
        id: usuario2.id,
        nome: 'Mecânico 2',
        especialidade: 'GERAL',
        cpf: gerarCpf(),
        email: makeCliente().getEmail().getValor()
      },
    })

    const response = await fetch(
      `${baseUrl}/ordens-servicos/${osDomain.getId().toValue()}/finalizar-execucao`,
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

  it('deve retornar 404 (Not Found) ao tentar finalizar execução de uma ordem de serviço inexistente', async () => {
    const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })
    await prisma.mecanico.create({
      data: {
        id: usuario.id,
        nome: 'Mecânico Teste',
        especialidade: 'GERAL',
        cpf: gerarCpf(),
        email: makeCliente().getEmail().getValor()
      },
    })

    const response = await fetch(
      `${baseUrl}/ordens-servicos/${randomUUID()}/finalizar-execucao`,
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

  it('deve retornar 400 (Bad Request) se o ID da ordem de serviço não for um UUID válido', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })

    const response = await fetch(
      `${baseUrl}/ordens-servicos/id-invalido/finalizar-execucao`,
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
      `${baseUrl}/ordens-servicos/${randomUUID()}/finalizar-execucao`,
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