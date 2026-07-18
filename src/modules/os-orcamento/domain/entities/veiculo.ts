import { Entity } from '@/core/entities/entity.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Optional } from '@/core/types/optional.js'
import { Placa } from '@/modules/os-orcamento/domain/entities/value-objects/placa.js'

export type VeiculoProps = {
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
    props: Optional<VeiculoProps, 'criadoEm' | 'atualizadoEm'>,
    id?: UniqueEntityID,
  ): Veiculo {
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

    return new Veiculo(
      {
        ...props,
        criadoEm: props.criadoEm ?? new Date(),
      },
      id,
    )
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
