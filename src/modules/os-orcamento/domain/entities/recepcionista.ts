import { NomeCompleto } from './value-objects/nome-completo.js'
import { Cpf } from './value-objects/cpf.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Optional } from '@/core/types/optional.js'
import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { RecepcionistaCriadoEvent } from '../events/recepcionista-criado-event.js'
import { ArgumentoInvalidoError } from '@/core/errors/domain-errors/argumento-invalido-error.js'

export type RecepcionistaProps = {
  nome: NomeCompleto
  email: Email
  cpf: Cpf
  criadoEm: Date
  atualizadoEm?: Date
  desativadoEm?: Date | null
}

export class Recepcionista extends AggregateRoot<RecepcionistaProps> {
  public static criar(
    props: Optional<RecepcionistaProps, 'criadoEm'>,
    id?: UniqueEntityID
  ): Recepcionista {
    this.validar(props)

    const propriedadesCompletas: RecepcionistaProps = {
      nome: props.nome,
      email: props.email,
      cpf: props.cpf,
      criadoEm: props.criadoEm ?? new Date(),
      atualizadoEm: props.atualizadoEm,
      desativadoEm: props.desativadoEm ?? null,
    }

    const recepcionista = new Recepcionista(propriedadesCompletas, id)

    if (!id) {
      recepcionista.addDomainEvent(new RecepcionistaCriadoEvent(recepcionista))
    }

    return recepcionista
  }

  private static validar(props: Optional<RecepcionistaProps, 'criadoEm'>): void {
    if (!props.nome?.getValor()?.trim()) {
      throw new ArgumentoInvalidoError('Nome do recepcionista é obrigatório.')
    }

    if (!props.cpf?.getValor()?.trim()) {
      throw new ArgumentoInvalidoError('CPF do recepcionista é obrigatório.')
    }

    if (!props.email?.getValor()?.trim()) {
      throw new ArgumentoInvalidoError('E-mail do recepcionista é obrigatório.')
    }
  }

  // Getters
  public getNome(): NomeCompleto {
    return this.props.nome
  }

  public getEmail(): Email {
    return this.props.email
  }

  public getCpf(): Cpf {
    return this.props.cpf
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }

  public getDesativadoEm(): Date | undefined | null {
    return this.props.desativadoEm
  }

  // Métodos de Comportamento e Regra de Negócio
  public isAtivo(): boolean {
    return this.props.desativadoEm === null
  }

  private touch(): void {
    this.props.atualizadoEm = new Date()
  }

  public desativar(): void {
    if (this.props.desativadoEm) {
      throw new ArgumentoInvalidoError('Este recepcionista já está desativado.')
    }
    this.props.desativadoEm = new Date()
    this.touch()
  }

  public reativar(): void {
    if (this.isAtivo()) {
      throw new ArgumentoInvalidoError('Este recepcionista já está ativo.')
    }
    this.props.desativadoEm = null
    this.touch()
  }
}