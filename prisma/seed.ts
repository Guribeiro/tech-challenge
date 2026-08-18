import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { generate as gerarCpf } from 'gerador-validador-cpf'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('🔄 Limpando banco de dados...');

  // Limpeza na ordem inversa de dependência
  await prisma.termoLiberacao.deleteMany();
  await prisma.fatura.deleteMany();
  await prisma.orcamentoComponente.deleteMany();
  await prisma.orcamentoServico.deleteMany();
  await prisma.orcamento.deleteMany();
  await prisma.ordemServicoComponente.deleteMany();
  await prisma.ordemServicoServico.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.mecanico.deleteMany();
  await prisma.recepcionista.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🌱 Populando dados...');

  // =========================================================================
  // 1. USUÁRIOS E PERFIS (Atendendo à Regra 3: Mesmos IDs)
  // =========================================================================
  const SENHA_PADRAO = 'senha123';
  const passwordHash = await bcrypt.hash(SENHA_PADRAO, 10);

  const adminId = randomUUID();
  const recepId = randomUUID();
  const mec1Id = randomUUID();
  const mec2Id = randomUUID();
  const cli1Id = randomUUID();
  const cli2Id = randomUUID();

  // Admin
  await prisma.usuario.create({
    data: {
      id: adminId,
      email: 'admin@oficina.com',
      senhaHash: passwordHash,
      role: 'ADMIN',
    },
  });

  // Recepcionista
  await prisma.usuario.create({
    data: {
      id: recepId,
      email: 'maria.recepcao@oficina.com',
      senhaHash: passwordHash,
      role: 'RECEPCAO',
    },
  });
  await prisma.recepcionista.create({
    data: {
      id: recepId,
      nome: 'Maria Oliveira',
      email: 'maria.recepcao@oficina.com',
      cpf: gerarCpf(),
    },
  });

  // Mecânicos
  await prisma.usuario.create({
    data: {
      id: mec1Id,
      email: 'carlos.mecanico@oficina.com',
      senhaHash: passwordHash,
      role: 'MECANICO',
    },
  });
  await prisma.mecanico.create({
    data: {
      id: mec1Id,
      nome: 'Carlos Silva',
      email: 'carlos.mecanico@oficina.com',
      cpf: gerarCpf(),
      especialidade: 'Injeção Eletrônica e Motor',
    },
  });

  await prisma.usuario.create({
    data: {
      id: mec2Id,
      email: 'roberto.mecanico@oficina.com',
      senhaHash: passwordHash,
      role: 'MECANICO',
    },
  });
  await prisma.mecanico.create({
    data: {
      id: mec2Id,
      nome: 'Roberto Santos',
      email: 'roberto.mecanico@oficina.com',
      cpf: gerarCpf(),
      especialidade: 'Suspensão e Freios',
    },
  });

  // Clientes
  await prisma.cliente.create({
    data: {
      id: cli1Id,
      nome: 'João da Silva',
      email: 'joao.cliente@gmail.com',
      cpf: gerarCpf(),
      telefone: '(11) 98765-4321',
      tipo: 'PF',
    },
  });

  await prisma.usuario.create({
    data: {
      id: cli1Id,
      email: 'joao.cliente@gmail.com',
      senhaHash: passwordHash,
      role: 'CLIENTE',
    },
  });

  await prisma.cliente.create({
    data: {
      id: cli2Id,
      nome: 'Transportadora Express Ltda',
      email: 'contato@logistica.com',
      cpf: gerarCpf(),
      telefone: '(11) 3333-4444',
      tipo: 'PJ',
    },
  });

  await prisma.usuario.create({
    data: {
      id: cli2Id,
      email: 'contato@logistica.com',
      senhaHash: passwordHash,
      role: 'CLIENTE',
    },
  });


  // =========================================================================
  // 2. VEÍCULOS
  // =========================================================================
  const veic1 = await prisma.veiculo.create({
    data: {
      id: randomUUID(),
      placa: 'ABC1D23',
      marca: 'Volkswagen',
      modelo: 'Gol 1.6',
      ano: 2020,
      cor: 'Branco',
      quilometragem: 45000,
      combustivel: 'Flex',
      clienteId: cli1Id,
    },
  });

  const veic2 = await prisma.veiculo.create({
    data: {
      id: randomUUID(),
      placa: 'XYZ9K87',
      marca: 'Chevrolet',
      modelo: 'Onix 1.0 Turbo',
      ano: 2022,
      cor: 'Preto',
      quilometragem: 28000,
      combustivel: 'Flex',
      clienteId: cli1Id,
    },
  });

  const veic3 = await prisma.veiculo.create({
    data: {
      id: randomUUID(),
      placa: 'MNO5E55',
      marca: 'Fiat',
      modelo: 'Fiorino 1.4',
      ano: 2021,
      cor: 'Prata',
      quilometragem: 82000,
      combustivel: 'Flex',
      clienteId: cli2Id,
    },
  });

  // =========================================================================
  // 3. PRODUTOS (Preços em centavos: R$ 150,00 -> 15000)
  // =========================================================================
  const prodOleo = await prisma.produto.create({
    data: {
      id: randomUUID(),
      nome: 'Óleo Sintético 5W30',
      tipo: 'INSUMO',
      marca: 'Castrol',
      codigoSKU: 'SKU-OLEO-5W30',
      precoCusto: 3000,
      precoUnitario: 5500,
      quantidadeEstoque: 100,
      quantidadeReservada: 5,
      estoqueMinimo: 20,
      estoqueMaximo: 200,
      unidadeMedida: 'L',
      localizacao: 'Prateleira A1',
    },
  });

  const prodPastilha = await prisma.produto.create({
    data: {
      id: randomUUID(),
      nome: 'Jogo de Pastilhas de Freio Dianteira',
      tipo: 'PECA',
      marca: 'Cobreq',
      codigoSKU: 'SKU-PAST-COB01',
      precoCusto: 8000,
      precoUnitario: 14000,
      quantidadeEstoque: 30,
      quantidadeReservada: 2,
      estoqueMinimo: 5,
      estoqueMaximo: 50,
      unidadeMedida: 'JOGO',
      localizacao: 'Prateleira B3',
    },
  });

  const prodFiltro = await prisma.produto.create({
    data: {
      id: randomUUID(),
      nome: 'Filtro de Óleo do Motor',
      tipo: 'PECA',
      marca: 'Tecfil',
      codigoSKU: 'SKU-FILT-TEC02',
      precoCusto: 1500,
      precoUnitario: 3500,
      quantidadeEstoque: 50,
      quantidadeReservada: 3,
      estoqueMinimo: 10,
      estoqueMaximo: 100,
      unidadeMedida: 'UN',
      localizacao: 'Prateleira A2',
    },
  });

  // =========================================================================
  // 4. SERVIÇOS
  // =========================================================================
  const servTrocaOleo = await prisma.servico.create({
    data: {
      id: randomUUID(),
      categoria: 'MANUTENCAO_PREVENTIVA',
      nome: 'Troca de Óleo e Filtro',
      descricao: 'Mão de obra para substituição do óleo de motor e filtro.',
      valorReferencia: 8000,
    },
  });

  const servFreio = await prisma.servico.create({
    data: {
      id: randomUUID(),
      categoria: 'SEGURANCA',
      nome: 'Manutenção do Sistema de Freios',
      descricao: 'Troca de pastilhas, discos e sangria do sistema.',
      valorReferencia: 18000,
    },
  });

  const servAlinhamento = await prisma.servico.create({
    data: {
      id: randomUUID(),
      categoria: 'MECANICA_GERAL',
      nome: 'Alinhamento 3D e Balanceamento',
      descricao: 'Alinhamento de direção e balanceamento das 4 rodas.',
      valorReferencia: 12000,
    },
  });

  // =========================================================================
  // 5. ORDENS DE SERVIÇO (Atendendo à Regra 1 e Regra 2)
  // =========================================================================

  // OS 1: Status RECEBIDA (Regra 2: mecanicoId deve ser NULL)
  const osRecebida = await prisma.ordemServico.create({
    data: {
      id: randomUUID(),
      clienteId: cli1Id,
      veiculoId: veic1.id,
      mecanicoId: null, // Regra 2: Apenas RECEBIDA não possui mecanicoId
      descricao: 'Barulho estranho na suspensão dianteira ao passar em lombadas.',
      prioridade: 'MEDIA',
      prioridadePeso: 2,
      eGarantia: false,
      status: 'RECEBIDA',
    },
  });

  // OS 2: Status EM_EXECUCAO
  const osEmExecucao = await prisma.ordemServico.create({
    data: {
      id: randomUUID(),
      clienteId: cli1Id,
      veiculoId: veic2.id,
      mecanicoId: mec1Id,
      descricao: 'Revisão preventiva de 30.000km.',
      prioridade: 'BAIXA',
      prioridadePeso: 1,
      eGarantia: false,
      status: 'EM_EXECUCAO',
      iniciadoEm: new Date('2026-07-30T08:00:00Z'),
    },
  });

  // OS 3: Status FINALIZADA
  const osFinalizada = await prisma.ordemServico.create({
    data: {
      id: randomUUID(),
      clienteId: cli2Id,
      veiculoId: veic3.id,
      mecanicoId: mec2Id,
      descricao: 'Substituição das pastilhas e alinhamento.',
      prioridade: 'ALTA',
      prioridadePeso: 3,
      eGarantia: false,
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-07-28T09:00:00Z'),
      finalizadoEm: new Date('2026-07-28T11:30:00Z'),
    },
  });

  // OS 4: Status ENCERRADA_REJEICAO (Regra 1: Deve possuir TermoLiberacao)
  const osEncerradaRejeicao = await prisma.ordemServico.create({
    data: {
      id: randomUUID(),
      clienteId: cli1Id,
      veiculoId: veic1.id,
      mecanicoId: mec1Id,
      descricao: 'Troca completa de embreagem.',
      prioridade: 'MEDIA',
      prioridadePeso: 2,
      eGarantia: false,
      status: 'ENCERRADA_REJEICAO',
      iniciadoEm: new Date('2026-07-20T10:00:00Z'),
      finalizadoEm: new Date('2026-07-20T10:30:00Z'),
    },
  });

  // OS 5: Status ENCERRADA (Regra 1: Deve possuir TermoLiberacao)
  const osEncerrada = await prisma.ordemServico.create({
    data: {
      id: randomUUID(),
      clienteId: cli2Id,
      veiculoId: veic3.id,
      mecanicoId: mec2Id,
      descricao: 'Troca de óleo, filtros e revisão geral de frota.',
      prioridade: 'URGENTE',
      prioridadePeso: 4,
      eGarantia: false,
      status: 'ENCERRADA',
      iniciadoEm: new Date('2026-07-25T08:00:00Z'),
      finalizadoEm: new Date('2026-07-25T12:00:00Z'),
    },
  });

  // =========================================================================
  // 6. SERVIÇOS E COMPONENTES DAS OSs
  // =========================================================================

  // Itens da OS 5 (Encerrada)
  await prisma.ordemServicoServico.create({
    data: {
      id: randomUUID(),
      ordemServicoId: osEncerrada.id,
      servicoId: servTrocaOleo.id,
      nome: servTrocaOleo.nome,
      descricao: servTrocaOleo.descricao,
      categoria: servTrocaOleo.categoria,
      precoUnitario: 8000,
    },
  });

  await prisma.ordemServicoComponente.createMany({
    data: [
      {
        id: randomUUID(),
        ordemServicoId: osEncerrada.id,
        produtoId: prodOleo.id,
        nome: prodOleo.nome,
        tipo: prodOleo.tipo,
        marca: prodOleo.marca,
        codigoSKU: prodOleo.codigoSKU,
        precoCusto: prodOleo.precoCusto,
        precoUnitario: prodOleo.precoUnitario,
        unidadeMedida: prodOleo.unidadeMedida,
        quantidade: 4,
      },
      {
        id: randomUUID(),
        ordemServicoId: osEncerrada.id,
        produtoId: prodFiltro.id,
        nome: prodFiltro.nome,
        tipo: prodFiltro.tipo,
        marca: prodFiltro.marca,
        codigoSKU: prodFiltro.codigoSKU,
        precoCusto: prodFiltro.precoCusto,
        precoUnitario: prodFiltro.precoUnitario,
        unidadeMedida: prodFiltro.unidadeMedida,
        quantidade: 1,
      },
    ],
  });

  // =========================================================================
  // 7. ORÇAMENTOS E FATURAS
  // =========================================================================

  // Orçamento da OS 4 (Recusado pelo cliente)
  const orcamentoRecusado = await prisma.orcamento.create({
    data: {
      id: randomUUID(),
      ordemServicoId: osEncerradaRejeicao.id,
      clienteId: cli1Id,
      versao: 1,
      descontoPorcentagem: 0,
      status: 'RECUSADO',
    },
  });

  // Orçamento da OS 5 (Aprovado e Faturado)
  const orcamentoAprovado = await prisma.orcamento.create({
    data: {
      id: randomUUID(),
      ordemServicoId: osEncerrada.id,
      clienteId: cli2Id,
      versao: 1,
      descontoPorcentagem: 5,
      status: 'APROVADO',
    },
  });

  await prisma.orcamentoServico.create({
    data: {
      id: randomUUID(),
      orcamentoId: orcamentoAprovado.id,
      servicoId: servTrocaOleo.id,
      nome: servTrocaOleo.nome,
      categoria: servTrocaOleo.categoria,
      precoUnitario: 8000,
    },
  });

  await prisma.orcamentoComponente.create({
    data: {
      id: randomUUID(),
      orcamentoId: orcamentoAprovado.id,
      produtoId: prodOleo.id,
      nome: prodOleo.nome,
      tipo: prodOleo.tipo,
      precoCusto: prodOleo.precoCusto,
      precoUnitario: prodOleo.precoUnitario,
      quantidade: 4,
    },
  });

  // Fatura referente ao orçamento aprovado
  await prisma.fatura.create({
    data: {
      id: randomUUID(),
      orcamentoId: orcamentoAprovado.id,
      status: 'PAGA',
      valorTotal: 28500, // (8000 + 4 * 5500) - 5% desconto
      pagaEm: new Date('2026-07-25T12:30:00Z'),
    },
  });

  // =========================================================================
  // 8. TERMOS DE LIBERAÇÃO (Atendendo à Regra 1: Apenas ENCERRADA_REJEICAO e ENCERRADA)
  // =========================================================================

  // Termo para a OS Encerrada por Rejeição de Orçamento
  await prisma.termoLiberacao.create({
    data: {
      id: randomUUID(),
      ordemServicoId: osEncerradaRejeicao.id,
      placaVeiculo: veic1.placa,
      motivo: 'REJEICAO_ORCAMENTO',
      conteudo:
        'O cliente optou por não realizar o serviço após a apresentação do orçamento referente à troca de embreagem. Veículo liberado sem reparos.',
      emitidoEm: new Date('2026-07-20T11:00:00Z'),
    },
  });

  // Termo para a OS Encerrada com Sucesso/Pagamento Aprovado
  await prisma.termoLiberacao.create({
    data: {
      id: randomUUID(),
      ordemServicoId: osEncerrada.id,
      placaVeiculo: veic3.placa,
      motivo: 'PAGAMENTO_APROVADO',
      conteudo:
        'Serviços concluídos e pagamento confirmado via Fatura #fat-01. Veículo liberado para rodagem em perfeitas condições.',
      emitidoEm: new Date('2026-07-25T13:00:00Z'),
    },
  });

  console.log('✅ Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });