import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/infra/nest/app.module.js';
import { DatabaseModule } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import { makeOrdemServico } from '../../factories/make-ordem-servico.js';
import { PrismaOrdemServicoRepository } from '@/infra/database/prisma/repositories/prisma-ordem-servico.repository.js';
import { PrismaService } from '@/infra/database/prisma/prisma.service.js';
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js';
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js';
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js';
import { PrismaOrdemServicoMapper } from '@/infra/database/prisma/mappers/prisma-ordem-servico-mapper.js';
import { generate as gerarCpf } from 'gerador-validador-cpf'

describe('Calcular Tempo Médio de Execução de Serviços (E2E)', () => {
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

  it('[GET] /ordens-servicos/metricas/tempo-medio', async () => {
    // 1. Gerar token de autenticação com uma role permitida ('ADMIN' ou 'RECEPCAO')
    const { accessToken, usuario } = await makeUsuarioAutenticado(app, {
      role: 'ADMIN',
    })

    // 2. Prepara Cliente e Veículo
    const clienteId = new UniqueEntityID()
    const veiculoId = new UniqueEntityID()
    const mecanicoId = new UniqueEntityID()

    await prisma.mecanico.create({
      data: {
        id: mecanicoId.toValue(),
        nome: 'Mecânico Teste',
        email: 'mecanico@email.com',
        cpf: gerarCpf(),
      },
    })


    await prisma.cliente.create({
      data: {
        id: clienteId.toValue(),
        nome: 'Cliente Exemplo Diagnóstico',
        email: `cliente-${clienteId.toValue().substring(0, 8)}@example.com`,
        cpf: gerarCpf(),
        telefone: '11999999999',
        tipo: 'PF',
      },
    })

    await prisma.veiculo.create({
      data: {
        id: veiculoId.toValue(),
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        placa: 'ABC1234',
        clienteId: clienteId.toValue(),
      },
    })

    // 2. Criar instâncias usando a factory makeOrdemServico e persistir via repositório

    const os1 = makeOrdemServico({
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      finalizadoEm: new Date('2026-06-01T11:00:00.000Z'), // 60 minutos
      clienteId: clienteId,
      mecanicoId: mecanicoId,
      veiculoId: veiculoId,
      eGarantia: false,
      descricao: 'Troca de óleo',
      prioridade: Prioridade.restaurar('MEDIA', 2),
    });

    const os2 = makeOrdemServico({
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      finalizadoEm: new Date('2026-06-01T12:00:00.000Z'), // 120 minutos
      clienteId: clienteId,
      mecanicoId: mecanicoId,
      veiculoId: veiculoId,
      eGarantia: false,
      descricao: 'Troca de óleo',
      prioridade: Prioridade.restaurar('MEDIA', 2),
    });

    const os3 = makeOrdemServico({
      status: 'EM_EXECUCAO',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      clienteId: clienteId,
      mecanicoId: mecanicoId,
      veiculoId: veiculoId,
      eGarantia: false,
      descricao: 'Troca de óleo',
      prioridade: Prioridade.restaurar('MEDIA', 2),
    });

    await prisma.ordemServico.createMany({
      data: [
        {
          id: os1.getId().toValue(),
          clienteId: os1.getClienteId().toValue(),
          veiculoId: os1.getVeiculoId().toValue(),
          status: os1.getStatus(),
          eGarantia: os1.getEGarantia(),
          descricao: os1.getDescricao(),
          iniciadoEm: os1.getIniciadoEm(),
          finalizadoEm: os1.getFinalizadoEm(),
        },
        {
          id: os2.getId().toValue(),
          clienteId: os2.getClienteId().toValue(),
          veiculoId: os2.getVeiculoId().toValue(),
          status: os2.getStatus(),
          eGarantia: os2.getEGarantia(),
          descricao: os2.getDescricao(),
          iniciadoEm: os2.getIniciadoEm(),
          finalizadoEm: os2.getFinalizadoEm(),
        },
        {
          id: os3.getId().toValue(),
          clienteId: os3.getClienteId().toValue(),
          veiculoId: os3.getVeiculoId().toValue(),
          status: os3.getStatus(),
          eGarantia: os3.getEGarantia(),
          descricao: os3.getDescricao(),
          iniciadoEm: os3.getIniciadoEm(),
          finalizadoEm: os3.getFinalizadoEm(),
        }
      ],
    })

    // 3. Executar a requisição HTTP utilizando o fetch nativo do Node
    const queryParams = new URLSearchParams({
      dataInicio: '2026-06-01T00:00:00.000Z',
      dataFim: '2026-06-30T23:59:59.999Z',
    });

    const response = await fetch(
      `${baseUrl}/ordens-servicos/metricas/tempo-medio?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ContentType: 'application/json',
        },
      },
    );

    const body = await response.json();

    // 4. Validar o resultado esperado
    expect(response.status).toBe(200);
    expect(body).toEqual({
      metricas: {
        tempoMedioMinutos: 90,
        totalServicosConcluidos: 2,
      },
    });
  });

  it('[GET] /ordens-servicos/metricas/tempo-medio - deve retornar 403 se o usuário não tiver permissão', async () => {
    // Token com role não autorizada
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'MECANICO',
    })

    const response = await fetch(
      `${baseUrl}/ordens-servicos/metricas/tempo-medio`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
  });

  it('[GET] /ordens-servicos/metricas/tempo-medio - deve retornar 400 se a data de início for maior que a data de fim', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, {
      role: 'ADMIN',
    })


    const queryParams = new URLSearchParams({
      dataInicio: '2026-06-30T00:00:00.000Z',
      dataFim: '2026-06-01T00:00:00.000Z',
    });

    const response = await fetch(
      `${baseUrl}/ordens-servicos/metricas/tempo-medio?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status).toBe(400);
  });
});