import { BuscarFilaTrabalhoParams, BuscarFilaTrabalhoResultado, CalcularTempoMedioParams, OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { OrdemServico } from "../../domain/entities/ordem-servico.js"
import { DomainEvents } from "@/core/events/domain-events.js"

export class InMemoryOrdemServicoRepository implements OrdemServicoRepository {
  public items: OrdemServico[] = []

  async create(ordemServico: OrdemServico): Promise<void> {
    this.items.push(ordemServico)

    DomainEvents.dispatchEventsForAggregate(ordemServico)
    ordemServico.clearEvents()
  }

  async save(ordemServico: OrdemServico): Promise<void> {
    const index = this.items.findIndex(os => os.getId().equals(ordemServico.getId()))
    if (index !== -1) {
      this.items[index] = ordemServico
    }

    DomainEvents.dispatchEventsForAggregate(ordemServico)
    ordemServico.clearEvents()
  }

  async findById(id: string): Promise<OrdemServico | null> {
    return this.items.find(os => os.getId().toValue() === id) || null
  }

  async listServiceQueue({
    pagina = 1,
    limite = 10,
    status = 'RECEBIDA',
  }: BuscarFilaTrabalhoParams): Promise<BuscarFilaTrabalhoResultado> {
    // 1. Filtra os itens pelo status (se fornecido)
    const itensFiltrados = this.items.filter((item) => {
      if (!status) return true

      const itemStatus = item.getStatus()

      return itemStatus === status
    })

    // 2. Ordena por peso da prioridade (decrescente)
    const itensOrdenados = [...itensFiltrados].sort((a, b) => {
      const prioridadeA = a.getPrioridade().getPeso()
      const prioridadeB = b.getPrioridade().getPeso()

      return prioridadeB - prioridadeA
    })

    // 3. Aplica a paginação (skip e take em memória)
    const inicio = (pagina - 1) * limite
    const fim = inicio + limite
    const itensPaginados = itensOrdenados.slice(inicio, fim)

    // 4. Retorna a mesma estrutura do resultado retornado pelo Prisma
    return {
      ordensServicos: itensPaginados,
      total: itensFiltrados.length,
      pagina,
      limite,
    }
  }
  async findManyReadyToInitialize(mecanicoId?: string): Promise<OrdemServico[]> {
    // 1. Filtra os registros com base nas regras de negócio
    const ordensFiltradas = this.items.filter(item => {
      const statusValido = item.getStatus() === 'PRONTA_PARA_INICIAR'

      if (mecanicoId) {
        const temMecanicoAtribuido = item.getMecanicoId()?.toValue() === mecanicoId
        return statusValido && temMecanicoAtribuido
      }

      return statusValido
    })

    return ordensFiltradas.sort((a, b) => {
      const pesoA = a.getPrioridade().getPeso()
      const pesoB = b.getPrioridade().getPeso()

      return pesoB - pesoA
    })
  }

  async calcularTempoMedio(params?: CalcularTempoMedioParams): Promise<{
    tempoMedioMinutos: number;
    totalServicosConcluidos: number;
  }> {
    const ordensConcluidas = this.items.filter(item => {
      const isFinalizada =
        item.getStatus() === 'FINALIZADA' &&
        item.getIniciadoEm() !== null &&
        item.getIniciadoEm() !== undefined &&
        item.getFinalizadoEm() !== null &&
        item.getFinalizadoEm() !== undefined;

      if (!isFinalizada) return false;

      const dataFinalizacao = new Date(item.getFinalizadoEm()!).getTime();

      if (params?.dataInicio && dataFinalizacao < params.dataInicio.getTime()) {
        return false;
      }

      if (params?.dataFim && dataFinalizacao > params.dataFim.getTime()) {
        return false;
      }

      return true;
    });

    const totalServicosConcluidos = ordensConcluidas.length;

    if (totalServicosConcluidos === 0) {
      return { tempoMedioMinutos: 0, totalServicosConcluidos: 0 };
    }

    const somaTemposMinutos = ordensConcluidas.reduce((acc, item) => {
      const inicio = new Date(item.getIniciadoEm()!).getTime();
      const fim = new Date(item.getFinalizadoEm()!).getTime();
      return acc + (fim - inicio) / (1000 * 60);
    }, 0);

    return {
      tempoMedioMinutos: Number((somaTemposMinutos / totalServicosConcluidos).toFixed(2)),
      totalServicosConcluidos,
    };
  }
}
