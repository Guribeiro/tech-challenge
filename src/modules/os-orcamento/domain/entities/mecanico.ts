import { NomeCompleto } from './value-objects/nome-completo.js'
import { Cpf } from './value-objects/cpf.js'
import { Optional } from '@/core/types/optional.js'
import { AggregateRoot } from '@/core/entities/aggregate-root.js'
import { MecanicoCriadoEvent } from '../events/mecanico-criado-event.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Email } from '@/shared/domain/value-objects/email.js'

export type MecanicoProps = {
  nome: NomeCompleto
  email: Email
  cpf: Cpf
  especialidade?: string // Ex: Suspensão, Motores, Injeção Eletrônica
  criadoEm: Date
  atualizadoEm?: Date
  desativadoEm?: Date | null
}

export class Mecanico extends AggregateRoot<MecanicoProps> {
  public static criar(props: Optional<MecanicoProps, 'criadoEm'>, id?: UniqueEntityID): Mecanico {
    if (!props.nome?.getValor().trim()) {
      throw new Error('Nome do mecânico é obrigatório.')
    }

    if (!props.cpf?.getValor().trim()) {
      throw new Error('CPF do mecânico é obrigatório.')
    }

    // Define valores padrão para propriedades opcionais se não forem enviadas
    const propriedadesCompletas: MecanicoProps = {
      nome: props.nome,
      email: props.email,
      cpf: props.cpf,
      especialidade: props.especialidade,
      criadoEm: new Date(),
      desativadoEm: props.desativadoEm ?? null,
    }

    const mecanico = new Mecanico(propriedadesCompletas, id)

    if (!id) {
      mecanico.addDomainEvent(new MecanicoCriadoEvent(mecanico))
    }

    return mecanico
  }

  public getNome(): NomeCompleto {
    return this.props.nome
  }

  public getEmail(): Email {
    return this.props.email
  }

  public getCpf(): Cpf {
    return this.props.cpf
  }

  public getEspecialidade(): string | undefined {
    return this.props.especialidade
  }

  public getAtualizadoEm(): Date | undefined {
    return this.props.atualizadoEm
  }

  public getCriadoEm(): Date {
    return this.props.criadoEm
  }

  public getDesativadoEm(): Date | undefined | null {
    return this.props.desativadoEm
  }


  public isAtivo(): boolean {
    return this.props.desativadoEm === null
  }

  private touch() {
    this.props.atualizadoEm = new Date()
  }

  public desativar(): void {
    if (this.props.desativadoEm) {
      throw new Error('Este produto já está desativado.')
    }
    this.props.desativadoEm = new Date() // Grava o timestamp atual
    this.touch()
  }

  // Comportamento de reativação (se necessário no futuro)
  public reativar(): void {
    this.props.desativadoEm = null
    this.touch()
  }
}