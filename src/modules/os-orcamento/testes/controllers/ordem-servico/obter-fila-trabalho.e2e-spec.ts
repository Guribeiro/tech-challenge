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
import { randomUUID } from 'node:crypto'
import { ObterFilaTrabalhoResponseDto } from '@/modules/os-orcamento/dto/ordem-servico/obter-fila-trabalho-response.dto.js'

describe('Obter Fila de Trabalho (E2E)', () => {
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

  it('deve retornar a fila de trabalho paginada com sucesso quando autenticado como MECANICO (200)', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })

    const clienteDomain = makeCliente()
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

    // Cria duas ordens de serviço para testes de listagem e paginação
    const os1 = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      status: 'RECEBIDA',
    })
    const os2 = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      status: 'EM_EXECUCAO',
    })

    await prisma.ordemServico.createMany({
      data: [
        {
          id: os1.getId().toValue(),
          clienteId: os1.getClienteId().toValue(),
          veiculoId: os1.getVeiculoId().toValue(),
          status: os1.getStatus(),
          eGarantia: os1.getEGarantia(),
          descricao: os1.getDescricao(),
        },
        {
          id: os2.getId().toValue(),
          clienteId: os2.getClienteId().toValue(),
          veiculoId: os2.getVeiculoId().toValue(),
          status: os2.getStatus(),
          eGarantia: os2.getEGarantia(),
          descricao: os2.getDescricao(),
        },
      ],
    })

    const response = await fetch(`${baseUrl}/ordens-servicos/fila-trabalho?pagina=1&limite=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const body = await response.json() as ObterFilaTrabalhoResponseDto

    expect(response.status).toBe(200)
    expect(body).toHaveProperty('fila')
    expect(body).toHaveProperty('meta')
    expect(body.fila).toHaveLength(1)
    expect(body.meta).toMatchObject({
      total: 1,
      pagina: 1,
      limite: 10,
      totalPaginas: 1,
    })
  })

  it('deve filtrar a fila de trabalho corretamente por status específico', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'RECEPCAO',
    })

    const clienteDomain = makeCliente()
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

    const os1 = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      status: 'RECEBIDA'
    })

    const os2 = makeOrdemServico({
      clienteId: clienteDomain.getId(),
      veiculoId: veiculoDomain.getId(),
      status: 'EM_EXECUCAO',
    })

    await prisma.ordemServico.createMany({
      data: [
        {
          id: os1.getId().toValue(),
          clienteId: os1.getClienteId().toValue(),
          veiculoId: os1.getVeiculoId().toValue(),
          status: os1.getStatus(),
          eGarantia: os1.getEGarantia(),
          descricao: os1.getDescricao(),
        },
        {
          id: os2.getId().toValue(),
          clienteId: os2.getClienteId().toValue(),
          veiculoId: os2.getVeiculoId().toValue(),
          status: os2.getStatus(),
          eGarantia: os2.getEGarantia(),
          descricao: os2.getDescricao(),
        },
      ],
    })

    const response = await fetch(`${baseUrl}/ordens-servicos/fila-trabalho?status=EM_EXECUCAO`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const body = await response.json() as ObterFilaTrabalhoResponseDto

    expect(response.status).toBe(200)
    expect(body.fila).toHaveLength(1)
    expect(body.fila[0].status).toBe('EM_EXECUCAO')
    expect(body.meta.total).toBe(1)
  })

  it('deve retornar 403 (Forbidden) ao tentar acessar a fila de trabalho como CLIENTE (role não autorizada)', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'CLIENTE',
    })

    const response = await fetch(`${baseUrl}/ordens-servicos/fila-trabalho`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.status).toBe(403)
  })

  it('deve retornar 401 (Unauthorized) se não houver token de autenticação', async () => {
    const response = await fetch(`${baseUrl}/ordens-servicos/fila-trabalho`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status).toBe(401)
  })
})