import { CalcularTempoMediaExecucaoServicosUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/calcular-tempo-media-execucao.js';
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordem-servico-repository.js';
import { OrdemServico } from '@/modules/os-orcamento/domain/entities/ordem-servico.js';
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js';
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js';

let inMemoryOrdemServicoRepository: InMemoryOrdemServicoRepository;
let sut: CalcularTempoMediaExecucaoServicosUseCase;

describe('Calcular Tempo Médio de Execução de Serviços', () => {
  beforeEach(() => {
    inMemoryOrdemServicoRepository = new InMemoryOrdemServicoRepository();
    sut = new CalcularTempoMediaExecucaoServicosUseCase(inMemoryOrdemServicoRepository);
  });

  it('deve calcular corretamente o tempo médio e o total de serviços concluídos', async () => {
    // Arrange: Criando ordens de serviço finalizadas com tempos conhecidos
    // Exemplo 1: 60 minutos de execução (1 hora)
    const os1 = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-1'),
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      finalizadoEm: new Date('2026-06-01T11:00:00.000Z'),
      descricao: 'Serviço de teste 1',
      prioridade: Prioridade.restaurar('ALTA', 2),
      eGarantia: false,
      veiculoId: new UniqueEntityID('veiculo-1'),
    });

    // Exemplo 2: 120 minutos de execução (2 horas)
    const os2 = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-2'),
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      finalizadoEm: new Date('2026-06-01T12:00:00.000Z'),
      descricao: 'Serviço de teste 2',
      prioridade: Prioridade.restaurar('BAIXA', 1),
      eGarantia: false,
      veiculoId: new UniqueEntityID('veiculo-2'),
    });

    // Ordem ignorada (não finalizada)
    const os3 = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-3'),
      status: 'EM_EXECUCAO',
      iniciadoEm: new Date('2026-06-01T10:00:00.000Z'),
      descricao: 'Serviço de teste 3',
      prioridade: Prioridade.restaurar('MEDIA', 2),
      eGarantia: false,
      veiculoId: new UniqueEntityID('veiculo-3'),
    });

    await inMemoryOrdemServicoRepository.create(os1);
    await inMemoryOrdemServicoRepository.create(os2);
    await inMemoryOrdemServicoRepository.create(os3);

    // Act
    const result = await sut.execute({});

    // Assert
    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      tempoMedioMinutos: 90, // Média entre 60 e 120
      totalServicosConcluidos: 2,
    });
  });

  it('deve retornar zero quando não houver serviços concluídos', async () => {
    // Act
    const result = await sut.execute({});

    // Assert
    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      tempoMedioMinutos: 0,
      totalServicosConcluidos: 0,
    });
  });

  it('deve filtrar corretamente o cálculo por período de data de finalização', async () => {
    // Arrange
    const osAntiga = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-1'),
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-05-01T10:00:00.000Z'),
      finalizadoEm: new Date('2026-05-01T11:00:00.000Z'), // 60 min (Fora do período)
      descricao: 'Serviço de teste antiga',
      prioridade: Prioridade.restaurar('ALTA', 2),
      eGarantia: false,
      veiculoId: new UniqueEntityID('veiculo-1'),
    });

    const osNoPeriodo = OrdemServico.criar({
      clienteId: new UniqueEntityID('cliente-2'),
      status: 'FINALIZADA',
      iniciadoEm: new Date('2026-06-10T10:00:00.000Z'),
      finalizadoEm: new Date('2026-06-10T13:00:00.000Z'), // 180 min (Dentro do período)
      descricao: 'Serviço de teste no período',
      prioridade: Prioridade.restaurar('BAIXA', 1),
      eGarantia: false,
      veiculoId: new UniqueEntityID('veiculo-2'),
    });

    await inMemoryOrdemServicoRepository.create(osAntiga);
    await inMemoryOrdemServicoRepository.create(osNoPeriodo);

    // Act
    const result = await sut.execute({
      dataInicio: new Date('2026-06-01T00:00:00.000Z'),
      dataFim: new Date('2026-06-30T23:59:59.999Z'),
    });

    // Assert
    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      tempoMedioMinutos: 180,
      totalServicosConcluidos: 1,
    });
  });
});