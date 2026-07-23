import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'

export type VeiculoProps = {
  clienteId: UniqueEntityID
  placa: Placa
  marca: string
  modelo: string
  ano: number
  cor?: string
  quilometragem?: number
  combustivel?: string
  observacoes?: string
  criadoEm: Date
  atualizadoEm?: Date
  deletadoEm?: Date | null
}

export type AtualizarVeiculoProps = {
  placa: Placa
  marca: string
  modelo: string
  ano: number
  cor?: string
  quilometragem?: number
  combustivel?: string
  observacoes?: string
  criadoEm: Date
  atualizadoEm?: Date
}

export class Veiculo extends Entity<VeiculoProps> {
  public static criar(
    props: Optional<VeiculoProps, 'criadoEm'>,
    id?: UniqueEntityID,
  ): Veiculo {

    this.validar(props)

    return new Veiculo(
      {
        ...props,
        criadoEm: props.criadoEm ?? new Date(),
        deletadoEm: props.deletadoEm ?? null,
      },
      id,
    )
  }

  public atualizar(props: AtualizarVeiculoProps): void {
    // 1. Garante que os novos dados também atendem às regras de negócio
    Veiculo.validar(props)

    // 2. Atualiza as propriedades e registra o momento da alteração
    this.props.placa = props.placa
    this.props.marca = props.marca
    this.props.modelo = props.modelo
    this.props.ano = props.ano
    this.props.cor = props.cor
    this.props.quilometragem = props.quilometragem
    this.props.combustivel = props.combustivel
    this.props.observacoes = props.observacoes
    this.props.atualizadoEm = new Date()
  }

  private static validar(
    props: Pick<VeiculoProps, 'marca' | 'modelo' | 'ano' | 'quilometragem'>,
  ): void {
    if (!props.marca?.trim() || !props.modelo?.trim()) {
      throw new Error(
        'Marca e modelo são obrigatórios para o cadastro do veículo.',
      )
    }

    if (
      !Number.isInteger(props.ano) ||
      props.ano < 1900 ||
      props.ano > new Date().getFullYear() + 1
    ) {
      throw new Error('Ano do veículo inválido.')
    }

    if (props.quilometragem !== undefined && props.quilometragem < 0) {
      throw new Error('Quilometragem não pode ser negativa.')
    }
  }

  public deletar(): void {
    if (this.props.deletadoEm) {
      throw new Error('Este veículo já está excluído.')
    }

    this.props.deletadoEm = new Date()
    this.props.atualizadoEm = new Date()
  }

  public isDeletado(): boolean {
    return !!this.props.deletadoEm
  }

  public getDeletadoEm(): Date | null | undefined {
    return this.props.deletadoEm
  }

  public getClienteId(): UniqueEntityID {
    return this.props.clienteId
  }

  public getPlaca(): Placa {
    return this.props.placa
  }

  public getMarca(): string {
    return this.props.marca
  }

  public getModelo(): string {
    return this.props.modelo
  }

  public getAno(): number {
    return this.props.ano
  }

  public getCor(): string | undefined {
    return this.props.cor
  }

  public getQuilometragem(): number | undefined {
    return this.props.quilometragem
  }

  public getCombustivel(): string | undefined {
    return this.props.combustivel
  }

  public getObservacoes(): string | undefined {
    return this.props.observacoes
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }

  public toJSON(): Record<string, unknown> {
    return {
      placa: this.props.placa.getValor(),
      marca: this.props.marca,
      modelo: this.props.modelo,
      ano: this.props.ano,
      cor: this.props.cor,
      quilometragem: this.props.quilometragem,
      combustivel: this.props.combustivel,
      observacoes: this.props.observacoes,
    }
  }
}
