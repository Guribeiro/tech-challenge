// src/modules/os-orcamento/domain/entities/value-objects/ordem-servico-servico.ts
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { CategoriaServico } from '@/modules/os-orcamento/domain/entities/servico.js'

export interface OrdemServicoServicoProps {
  servicoId: UniqueEntityID
  nome: string
  categoria: CategoriaServico
  precoUnitario: number
  descricao?: string
  observacao?: string
}

export class OrdemServicoServico {
  private props: OrdemServicoServicoProps

  constructor(props: OrdemServicoServicoProps) {
    // Validação local: Garante que nenhuma linha da OS entre sem preço definido
    if (props.precoUnitario < 0) {
      throw new Error('O valor cobrado pelo serviço não pode ser negativo.')
    }

    this.props = props
  }

  // Getters explícitos para a OrdemServico usar no cálculo
  public getPrecoUnitario(): number { return this.props.precoUnitario }
  public getServicoId(): UniqueEntityID { return this.props.servicoId }
  public getNome(): string { return this.props.nome }
  public getCategoria(): CategoriaServico { return this.props.categoria }
  public getDescricao(): string | undefined { return this.props.descricao }
  public getObservacao(): string | undefined { return this.props.observacao }
}