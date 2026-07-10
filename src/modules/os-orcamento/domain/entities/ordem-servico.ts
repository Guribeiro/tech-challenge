import { Servico } from '@/modules/os-orcamento/domain/entities/servico.js'
import { Optional } from '@/core/types/optional.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Prioridade } from '@/modules/os-orcamento/domain/entities/value-objects/prioridade.js'
import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { OrdemServicoServicoList } from './value-objects/ordem-servico-servico-list.js'

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
  mecanicoId?: UniqueEntityID
  descricao: string
  prioridade: Prioridade
  eGarantia: boolean
  servicos: OrdemServicoServicoList
  itens?: ItemOrdemServico[]
  status: StatusOS
}

export class OrdemServico extends AggregateRoot<OrdemServicoProps> {
  public static criar(
    props: Optional<OrdemServicoProps, 'status' | 'mecanicoId'>,
    id?: string,
  ): OrdemServico {
    const propriedadesCompletas: OrdemServicoProps = {
      ...props,
      servicos: props.servicos ?? new OrdemServicoServicoList(),
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

    if (props.servicos && props.servicos.getItems().some((item) => !item)) {
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

  public getServicos(): OrdemServicoServicoList {
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

  public getMecanicoId(): UniqueEntityID | undefined {
    return this.props.mecanicoId
  }

  public iniciarDiagnóstico(mecanicoId: UniqueEntityID): void {
    if (this.props.status !== 'RECEBIDA') {
      throw new Error('O diagnóstico só pode ser iniciado para ordens de serviço recebidas.')
    }

    this.props.status = 'EM_DIAGNOSTICO'
    this.props.mecanicoId = mecanicoId
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      clienteId: this.props.clienteId,
      veiculoId: this.props.veiculoId,
      descricao: this.props.descricao,
      itens: this.props.itens,
      services: this.getServicos().getItems()
    }
  }
}
