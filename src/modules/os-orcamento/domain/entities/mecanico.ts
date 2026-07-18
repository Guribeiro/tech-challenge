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
  ativo: boolean
}

export class Mecanico extends AggregateRoot<MecanicoProps> {
  public static criar(props: Optional<MecanicoProps, 'ativo'>, id?: UniqueEntityID): Mecanico {
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
      ativo: props.ativo ?? true
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

  public isAtivo(): boolean {
    return this.props.ativo
  }

  /**
   * Métodos de comportamento (Regras de negócio)
   */
  public desativar(): void {
    this.props.ativo = false
  }

  public ativar(): void {
    this.props.ativo = true
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      nome: this.props.nome,
      cpf: this.props.cpf,
      especialidade: this.props.especialidade,
      ativo: this.props.ativo,
    }
  }
}