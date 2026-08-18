import { AggregateRoot } from "@/core/entities/aggregate-root.js"
import { UniqueEntityID } from "@/core/entities/unique-entity-id.js"
import { Optional } from "@/core/types/optional.js"
import { NotificacaoCriadaEvent } from "../events/notificacao-criada-event.js"

export interface NotificacaoProps {
  destinatarioId: UniqueEntityID // ID do Usuário que receberá a notificação
  titulo: string
  conteudo: string
  template?: string
  contexto?: Record<string, unknown>
  lidaEm?: Date | null
  criadaEm: Date
}

export class Notificacao extends AggregateRoot<NotificacaoProps> {
  static create(props: Optional<NotificacaoProps, 'criadaEm'>, id?: UniqueEntityID): Notificacao {
    const notificacao = new Notificacao({
      ...props,
      criadaEm: new Date()
    }, id)

    if (!id) {
      notificacao.addDomainEvent(new NotificacaoCriadaEvent(notificacao))
    }

    return notificacao
  }

  public getDestinatarioId(): UniqueEntityID {
    return this.props.destinatarioId
  }

  public getTitulo(): string {
    return this.props.titulo
  }

  public getConteudo(): string {
    return this.props.conteudo
  }

  public getTemplate() {
    return this.props.template
  }

  public getContexto() {
    return this.props.contexto
  }

  public getLidaEm(): Date | null | undefined {
    return this.props.lidaEm
  }

  public getCriadaEm(): Date {
    return this.props.criadaEm
  }

  public marcarComoLida() {
    this.props.lidaEm = new Date()
  }

}