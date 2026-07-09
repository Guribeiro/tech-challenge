import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { Entity } from '@/core/entities/entity.js'
import { Optional } from '@/core/types/optional.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'

export type StatusOS =
  | 'RECEBIDA'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'EM_EXECUCAO'
  | 'FINALIZADA'
  | 'ENTREGUE'
  | 'ENCERRADA_REJEICAO'

export type ServicoSolicitado = {
  servico: Servico
  observacao?: string
}

export type ItemOrdemServico = {
  tipo: 'PECA' | 'INSUMO'
  descricao: string
  quantidade: number
}

export type OrdemServicoProps = {
  clienteId: UniqueEntityID
  veiculoId: UniqueEntityID
  descricao: string
  prioridade: Prioridade
  eGarantia: boolean
  servicos?: ServicoSolicitado[]
  itens?: ItemOrdemServico[]
  status: StatusOS
}

export class OrdemServico extends Entity<OrdemServicoProps> {
  public static criar(
    props: Optional<OrdemServicoProps, 'status'>,
    id?: string,
  ): OrdemServico {
    const propriedadesCompletas: OrdemServicoProps = {
      ...props,
      status: props.status ?? 'RECEBIDA',
    }

    this.validar(propriedadesCompletas)

    return new OrdemServico(propriedadesCompletas, id)
  }

  private static validar(props: OrdemServicoProps): void {
    if (!props.clienteId || !props.veiculoId || !props.descricao?.trim()) {
      throw new Error(
        'Cliente, veículo e descrição são obrigatórios para uma ordem de serviço.',
      )
    }

    if (props.servicos && props.servicos.some((item) => !item.servico)) {
      throw new Error(
        'Cada serviço solicitado precisa apontar para uma entidade de serviço válida.',
      )
    }

    if (
      props.itens &&
      props.itens.some(
        (item) => !item.descricao?.trim() || item.quantidade <= 0,
      )
    ) {
      throw new Error(
        'Cada item precisa de descrição válida e quantidade maior que zero.',
      )
    }
  }

  public getClienteId(): UniqueEntityID {
    return this.props.clienteId
  }

  public getVeiculoId(): UniqueEntityID {
    return this.props.veiculoId
  }

  public getDescricao(): string {
    return this.props.descricao
  }

  public getServicos(): ServicoSolicitado[] | undefined {
    return this.props.servicos
  }

  public getItens(): ItemOrdemServico[] | undefined {
    return this.props.itens
  }

  public getStatus(): StatusOS {
    return this.props.status
  }

  public getPrioridade(): Prioridade {
    return this.props.prioridade
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      clienteId: this.props.clienteId,
      veiculoId: this.props.veiculoId,
      descricao: this.props.descricao,
      servicos: this.props.servicos?.map((servicoSolicitado) => ({
        id: servicoSolicitado.servico.getId(),
        nome: servicoSolicitado.servico.getNome(),
        categoria: servicoSolicitado.servico.getCategoria(),
        descricao: servicoSolicitado.servico.getDescricao(),
        valorReferencia: servicoSolicitado.servico.getValorReferencia(),
        observacao: servicoSolicitado.observacao,
      })),
      itens: this.props.itens,
    }
  }
}
